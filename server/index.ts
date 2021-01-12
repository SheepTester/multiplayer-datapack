import path from 'path'
import fs from 'fs-extra'
import express from 'express'
import expressWs from 'express-ws'
import asyncHandler from 'express-async-handler'
import WebSocket from 'ws'

import { port, baseDir, safeExtensions, debugUrl } from './args'

const app = express()
app.set('views', path.resolve(__dirname, './views'))
app.set('view options', {
  rmWhitespace: true
})
app.set('view engine', 'ejs')
// https://stackoverflow.com/a/51476990
const { app: wsApp } = expressWs(app)

if (debugUrl) {
  const url = debugUrl
  app.get('/bundle.js', (_req, res) => {
    res.redirect(url)
  })
}

app.get('/', (_req, res) => {
  res.render('editor')
})

app.get('/files/*', asyncHandler(async (req, res) => {
  if (req.path.includes('/.')) {
    return res.status(401).send('can\'t edit hidden files')
  }
  const {
    file: sendFile,
    component: asComponent,
    base: baseUrl = './',
  } = req.query
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
      await fs.writeFile(filePath, '')
    } else {
      return res.status(404).send('file doesn\'t exist and that extension isn\'t allowed')
    }
  }
  if (isDir) {
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
    if (asComponent) {
      res.render('directory', {
        files,
        baseUrl,
      })
    } else {
      res.render('directory-wrapper', {
        files,
        baseUrl,
      })
    }
  } else if (safeExtensions.test(filePath)) {
    if (sendFile) {
      res.sendFile(filePath)
    } else {
      res.render('editor', {})
    }
  } else {
    res.status(401).send('can\'t edit files of this extension')
  }
}))

interface Connections {
  connections: Set<WebSocket>
  file: string
}
const connections: Map<string, Connections> = new Map()
wsApp.ws('/wuss', async (ws, req) => {
  const { from } = req.query
  if (typeof from !== 'string') {
    ws.close()
    return
  }
  const filePath = path.resolve(baseDir, '.' + from.replace(/^\/files/, ''))
  let connsTemp = connections.get(from)
  if (!connsTemp) {
    try {
      const file = await fs.readFile(filePath, 'utf8')
      connsTemp = {
        connections: new Set(),
        file,
      }
      connections.set(from, connsTemp)
    } catch (err) {
      console.error(err)
      ws.close()
      return
    }
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
