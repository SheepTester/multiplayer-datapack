import path from 'path'
import fs from 'fs/promises'
import express from 'express'
import asyncHandler from 'express-async-handler'

import { port, baseDir, safeExtensions, debugUrl } from './args'

const app = express()
app.set('views', path.resolve(__dirname, './views'))
app.set('view options', {
  rmWhitespace: true
})
app.set('view engine', 'ejs')

if (debugUrl) {
  const url = debugUrl
  app.get('/bundle.js', (_req, res) => {
    res.redirect(url)
  })
}

app.use(express.static(path.resolve(__dirname, '../build')))
app.use('/static', express.static(path.resolve(__dirname, './static/')))

app.get('/', (_req, res) => {
  res.render('editor')
})

app.get('/files/*', asyncHandler(async (req, res) => {
  if (req.path.includes('/.')) {
    return res.status(401).send('can\'t edit hidden files')
  }
  const { component: asComponent, base: baseUrl = './' } = req.query
  const filePath = path.resolve(baseDir, '.' + req.path.replace(/^\/files/, ''))
  const [exists, isDir] = await fs.lstat(filePath)
    .then(stat => [true, stat.isDirectory()])
    .catch(() => [false, false])
  if (!exists) {
    res.status(404).send('File/directory not found')
  } else if (isDir) {
    const files = []
    for (const fileName of await fs.readdir(filePath)) {
      const file = await fs.lstat(path.resolve(filePath, fileName))
      if (fileName.startsWith('.')) continue
      files.push({
        name: fileName,
        isDir: file.isDirectory(),
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
    res.render('editor', {})
  } else {
    res.status(401).send('can\'t edit files of this extension')
  }
}))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
