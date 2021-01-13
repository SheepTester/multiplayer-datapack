import path from 'path'
import fs from 'fs-extra'
import { config } from 'dotenv'
import express from 'express'
import expressWs from 'express-ws'
import asyncHandler from 'express-async-handler'
import cookieSession from 'cookie-session'
import WebSocket from 'ws'

config()

import { port, baseDir, safeExtensions, debugSrc } from './args'

const app = express()
app.set('views', path.resolve(__dirname, './views'))
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
  const filePath = path.resolve(baseDir, '.' + req.path.replace(/^\/files/, ''))
  let [exists, isDir] = await fs.lstat(filePath)
    .then(stat => [true, stat.isDirectory()])
    .catch(() => [false, false])
  if (!exists) {
    isDir = req.path.endsWith('/')
    if (isDir) {
      await fs.ensureDir(filePath)
    } else if (safeExtensions.test(filePath)) {
      // There better be a slash in filePath
      const dirName = path.dirname(filePath)
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
      const totalPath = path.resolve(filePath, fileName)
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

app.delete('/files/*', asyncHandler(async (req, res) => {
  if (req.path.includes('/.')) {
    return res.status(401).send('can\'t delete hidden files')
  }
  const filePath = path.resolve(baseDir, '.' + req.path.replace(/^\/files/, ''))
  let [exists, isDir] = await fs.lstat(filePath)
    .then(stat => [true, stat.isDirectory()])
    .catch(() => [false, false])
  if (!exists) {
    return res.status(404).send('file doesn\'t exist')
  }
  if (isDir) {
    if ((await fs.readdir(filePath)).length) {
      return res.status(403).send('can\'t delete nonempty directories')
    } else {
      await fs.rmdir(filePath)
      res.send('ok')
    }
  } else if (safeExtensions.test(filePath)) {
    await fs.move(filePath, path.resolve(__dirname, '../deleted' + req.path.replace(/^\/files/, '')), {
      overwrite: true
    })
    res.send('ok')
  } else {
    res.status(401).send('can\'t delete files of this extension')
  }
}))

interface Connections {
  connections: Set<WebSocket>
  file: string
}
const connections: Map<string, Connections> = new Map()
wsApp.ws('/wuss', async (ws, req) => {
  const { from } = req.query
  if (typeof from !== 'string' || !from.startsWith('/files/')) {
    ws.close()
    return
  }
  const filePath = path.resolve(baseDir, '.' + from.replace(/^\/files/, ''))
  let connsTemp = connections.get(from)
  if (!connsTemp) {
    const file = await fs.readFile(filePath, 'utf8')
      .catch(() => '')
    connsTemp = {
      connections: new Set(),
      file,
    }
    connections.set(from, connsTemp)
  }
  const conns = connsTemp // dumb typescript
  conns.connections.add(ws)
  ws.send(JSON.stringify({
    type: 'file',
    file: conns.file,
  }))
  ws.on('message', async msg => {
    try {
      const { type, ...data } = JSON.parse(msg.toString())
      switch (type) {
        case 'changes': {
          for (const conn of conns.connections) {
            if (conn !== ws) {
              conn.send(JSON.stringify({
                type: 'changes',
                changes: data.changes,
              }))
            }
          }
          break
        }
        case 'file': {
          await fs.writeFile(filePath, data.file)
          break
        }
        default:
          ws.send(JSON.stringify({
            type: 'error',
            error: `Unknown message type ${type}`,
          }))
      }
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'error',
        error: err.message,
      }))
    }
  })
  ws.on('close', () => {
    conns.connections.delete(ws)
    if (conns.connections.size === 0) {
      connections.delete(from)
    }
  })
})

app.use(express.static(path.resolve(__dirname, '../build')))
app.use('/static', express.static(path.resolve(__dirname, './static/')))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
