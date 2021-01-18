import nodePath from 'path'
import fs from 'fs-extra'
import sanitize from 'sanitize-filename'
import express from 'express'
import expressWs from 'express-ws'
import asyncHandler from 'express-async-handler'
import cookieSession from 'cookie-session'
import WebSocket from 'ws'
import { config } from 'dotenv'
config()

import { Rearrangement, isRearrangement } from '../common/common'
import { port, baseDir, safeExtensions, debugSrc } from './args'

const app = express()
app.use(express.json())
app.set('views', nodePath.resolve(__dirname, './views'))
app.set('view options', {
  rmWhitespace: true
})
app.set('view engine', 'ejs')
app.use(cookieSession({
  name: 'session',
  keys: ['idk lol']
}))
// https://stackoverflow.com/a/51476990
const { app: wsApp } = expressWs(app)

interface FolderEntry {
  key: string
}
interface FileEntry {
  key: string
  modified: number
  size: number
}
async function scanFiles (scanPath: string, relPath: string = ''): Promise<(FileEntry | FolderEntry)[]> {
  const files: (FileEntry | FolderEntry)[] = []
  for (const name of await fs.readdir(scanPath)) {
    if (name.startsWith('.')) continue
    const totalPath = nodePath.resolve(scanPath, name)
    const file = await fs.lstat(totalPath)
    if (file.isDirectory()) {
      files.push({ key: relPath + name + '/' })
      files.push(...await scanFiles(totalPath, relPath + name + '/'))
    } else {
      files.push({
        key: relPath + name,
        modified: file.mtimeMs,
        size: file.size,
      })
    }
  }
  return files
}

let filePaths = scanFiles(baseDir)
  .catch(() => [])

if (debugSrc) {
  const url = debugSrc
  app.get('/*bundle.js', (req, res) => {
    res.redirect(url + req.path)
  })
}

app.use(asyncHandler(async (req, res, next) => {
  if (!req.session) throw new Error('session should exist')
  if (typeof req.query['set-password'] === 'string') {
    req.session.password = req.query['set-password']
    return res.redirect(req.path)
  }
  if (req.session.password === process.env.PASSWORD) {
    return next()
  }
  res.render('permission-needed')
}))

app.get('/', (_req, res) => {
  res.render('index')
})

app.get('/files/*', asyncHandler(async (req, res) => {
  if (req.path.includes('/.')) {
    return res.status(401).send('can\'t edit hidden files')
  }
  const {
    create: createPath,
    file: sendFile,
    component: asComponent,
    base: baseUrl = './',
    sidebar: sidebarMode,
  } = req.query
  if (createPath) {
    return res.redirect(typeof createPath === 'string' ? createPath : './')
  }
  const filePath = nodePath.resolve(baseDir, '.' + req.path.replace(/^\/files/, ''))
  let [exists, isDir] = await fs.lstat(filePath)
    .then(stat => [true, stat.isDirectory()])
    .catch(() => [false, false])
  if (!exists) {
    isDir = req.path.endsWith('/')
    if (isDir) {
      await fs.ensureDir(filePath)
    } else if (safeExtensions.test(filePath)) {
      // There better be a slash in filePath
      const dirName = nodePath.dirname(filePath)
      await fs.ensureDir(dirName)
    } else {
      return res.status(404).send('file doesn\'t exist and that extension isn\'t allowed')
    }
  }
  if (isDir) {
    if (!req.path.endsWith('/')) {
      return res.redirect(req.path + '/')
    }
    const files = []
    for (const fileName of await fs.readdir(filePath)) {
      const totalPath = nodePath.resolve(filePath, fileName)
      const file = await fs.lstat(totalPath)
      if (fileName.startsWith('.')) continue
      const isDir = file.isDirectory()
      files.push({
        valid: isDir || safeExtensions.test(fileName),
        name: fileName,
        isDir,
        modified: file.mtime,
        created: file.ctime,
        size: file.size,
      })
    }
    // Sort directories first, then sort directories/files alphabetically.
    files.sort((a, b) => +b.isDir - +a.isDir || a.name.localeCompare(b.name))
    if (asComponent) {
      res.render('directory', {
        files,
        baseUrl,
        sidebar: !!sidebarMode,
      })
    } else {
      res.render('directory-wrapper', {
        files,
        baseUrl,
        sidebar: !!sidebarMode,
        topLevel: req.path === '/files/',
      })
    }
  } else if (safeExtensions.test(filePath)) {
    if (req.path.endsWith('/')) {
      return res.redirect(req.path.replace(/\/+$/, ''))
    }
    if (sendFile) {
      res.sendFile(filePath)
    } else {
      res.render('editor', {
        newFile: !exists,
      })
    }
  } else {
    res.status(401).send('can\'t edit files of this extension')
  }
}))

const invalidKey = (key: string): boolean => typeof key !== 'string'
  || key.startsWith('.') || key.includes('/.')

interface ConnectionInfo {
  name: string
  start: Date
}

type Message = {
  type: 'rearrange'
  changes: Rearrangement[]
} | {
  type: 'open' | 'close' | 'claim-edit' | 'unclaim-edit'
  key: string
} | {
  type: 'save'
  key: string
  content: string
} | {
  type: 'name'
  name: string
}
function shouldBeMessage (value: any): asserts value is Message {
  if (value === null) throw new TypeError('Message cannot be null.')
  if (typeof value !== 'object') throw new TypeError('Message must be an object.')
  const { type, changes, key, content, name } = value
  if (typeof type !== 'string') throw new TypeError('Message type must be a string.')
  if (type === 'rearrange') {
    if (!Array.isArray(changes)) {
      throw new TypeError('Changes must be an array.')
    }
    if (!changes.every(isRearrangement)) {
      throw new TypeError('Not every change is a rearrangement.')
    }
  } else if (['open', 'close', 'claim-edit', 'unclaim-edit', 'save'].includes(type)) {
    if (typeof key !== 'string') {
      throw new TypeError('Key must be a string.')
    }
    if (type === 'save') {
      if (typeof content !== 'string') {
        throw new TypeError('Content must be a string.')
      }
    }
  } else if (type === 'name') {
    if (typeof name !== 'string') {
      throw new TypeError('Name must be a string.')
    }
  } else {
    throw new TypeError('Unknown message type.')
  }
}

const editors: Map<string, WebSocket> = new Map()
const fileViewers: Map<string, Set<WebSocket>> = new Map()
const connections: Map<WebSocket, ConnectionInfo> = new Map()
wsApp.ws('/wuss', async (ws, req) => {
  const info = {
    name: req.session && req.session.name || 'Suspicious unknown user from ' + req.ip,
    start: new Date(),
  }
  connections.set(ws, info)
  ws.send(JSON.stringify({
    type: 'files',
    files: await filePaths,
  }))
  ws.send(JSON.stringify({
    type: 'name',
    name: info.name,
  }))
  ws.on('message', async msg => {
    try {
      const data = JSON.parse(msg.toString())
      shouldBeMessage(data)
      switch (data.type) {
        case 'rearrange': {
          for (const change of data.changes) {
            try {
              switch (change.type) {
                case 'create': {
                  if (invalidKey(change.key)) continue
                  if (change.key.endsWith('/')) {
                    await fs.ensureDir(nodePath.resolve(baseDir, change.key))
                  } else if (safeExtensions.test(change.key)) {
                    await fs.writeFile(nodePath.resolve(baseDir, change.key), '')
                  }
                  break
                }
                case 'move': {
                  if (invalidKey(change.oldKey) || invalidKey(change.newKey)) continue
                  if (change.oldKey.endsWith('/') && change.newKey.endsWith('/') || safeExtensions.test(change.oldKey) && safeExtensions.test(change.newKey)) {
                    await fs.move(nodePath.resolve(baseDir, change.oldKey), nodePath.resolve(baseDir, change.newKey))
                  }
                  break
                }
                case 'delete': {
                  if (invalidKey(change.key)) continue
                  if (change.key.endsWith('/') || safeExtensions.test(change.key)) {
                    await fs.move(
                      nodePath.resolve(baseDir, change.key),
                      nodePath.resolve(
                        __dirname,
                        '../deleted/',
                        sanitize(new Date().toISOString() + '_' + change.key)
                          + (change.key.endsWith('/') ? '/' : '')
                      ),
                    )
                  }
                  break
                }
              }
            } catch {}
          }
          filePaths = scanFiles(baseDir)
          const files = await filePaths
          for (const conn of connections.keys()) {
            conn.send(JSON.stringify({
              type: 'files',
              files,
            }))
          }
          break
        }

        case 'open': {
          if (!invalidKey(data.key) && safeExtensions.test(data.key)) {
            let viewers = fileViewers.get(data.key)
            if (!viewers) {
              viewers = new Set()
              fileViewers.set(data.key, viewers)
            }
            viewers.add(ws)
            let editing = false
            if (!editors.has(data.key)) {
              editors.set(data.key, ws)
              editing = true
            }
            ws.send(JSON.stringify({
              type: 'file-content',
              key: data.key,
              content: await fs.readFile(nodePath.resolve(baseDir, data.key), 'utf8'),
              editing,
            }))
          } else {
            ws.send(JSON.stringify({
              type: 'file-content',
              key: data.key,
              content: null,
              editing: false,
            }))
          }
          break
        }

        case 'close': {
          const viewers = fileViewers.get(data.key)
          if (viewers) {
            viewers.delete(ws)
          }
          break
        }

        case 'claim-edit': {
          const oldEditor = editors.get(data.key)
          if (oldEditor) {
            oldEditor.send(JSON.stringify({
              type: 'not-editor',
              key: data.key,
            }))
          }
          editors.set(data.key, ws)
          ws.send(JSON.stringify({
            type: 'now-editor',
            key: data.key,
          }))
          break
        }

        case 'unclaim-edit': {
          if (editors.get(data.key) === ws) {
            editors.delete(data.key)
          }
          ws.send(JSON.stringify({
            type: 'not-editor',
            key: data.key,
          }))
          break
        }

        case 'save': {
          if (!invalidKey(data.key) && safeExtensions.test(data.key)) {
            if (ws !== editors.get(data.key)) return
            const viewers = fileViewers.get(data.key)
            if (viewers) {
              for (const viewer of viewers) {
                if (viewer !== ws) {
                  viewer.send(JSON.stringify({
                    type: 'file-content',
                    key: data.key,
                    content: data.content,
                  }))
                }
              }
            }
            await fs.writeFile(nodePath.resolve(baseDir, data.key), data.content)
          }
          break
        }

        case 'name': {
          info.name = data.name
          break
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'error',
        error: err.message,
      }))
    }
  })
  ws.on('close', () => {
    connections.delete(ws)
    for (const [key, editor] of editors) {
      if (editor === ws) {
        editors.delete(key)
      }
    }
    for (const viewers of fileViewers.values()) {
      viewers.delete(ws)
    }
  })
})

app.get('/connections', (_req, res) => {
  res.render('connections', {
    connections: Array.from(
      connections.entries(),
      ([ws, info]) => ({ ...info, state: ws.readyState }),
    ),
  })
})

app.post('/set-name', (req, res) => {
  const { name } = req.body
  if (typeof name === 'string' && name.length < 256 && name.length > 0) {
    if (req.session) {
      req.session.name = name
    }
  }
  res.status(204).end()
})

app.use(express.static(nodePath.resolve(__dirname, '../build')))
app.use('/static', express.static(nodePath.resolve(__dirname, './static/')))

app.listen(port, () => {
  console.log(`Multiplayer datapack editor available at http://localhost:${port}/`)
  console.log('')
  console.log(`Anyone who knows the password as set in your .env file can manipulate the files at ${baseDir} that satisfy ${safeExtensions}`)
  console.log('')
  console.log('Tip: do `npm start -- --help` for a list of options.')
})
