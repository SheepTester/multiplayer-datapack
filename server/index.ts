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

import { Rearrangements } from '../common/common'
import { port, baseDir, safeExtensions, debugSrc } from './args'

const app = express()
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

const invalidKey = (key: string): boolean => key.startsWith('.') || key.includes('/.')

const connections: Set<WebSocket> = new Set()
wsApp.ws('/wuss', async (ws, _req) => {
  connections.add(ws)
  ws.send(JSON.stringify({
    type: 'files',
    files: await filePaths,
  }))
  ws.on('message', async msg => {
    try {
      const { type, ...data } = JSON.parse(msg.toString())
      switch (type) {
        case 'rearrange': {
          const changes: Rearrangements[] = data.changes
          for (const change of changes) {
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
          for (const conn of connections) {
            conn.send(JSON.stringify({
              type: 'files',
              files,
            }))
          }
          break
        }
        default: {
          ws.send(JSON.stringify({
            type: 'error',
            error: `Unknown message type ${type}`,
          }))
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
  })
})

app.use(express.static(nodePath.resolve(__dirname, '../build')))
app.use('/static', express.static(nodePath.resolve(__dirname, './static/')))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
