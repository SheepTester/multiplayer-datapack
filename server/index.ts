import express from 'express'
import minimist from 'minimist'
import path from 'path'

const {
  port: portString = '8080',
} = minimist(process.argv.slice(2), {
  string: [
    'port',
  ],
  alias: {
    p: 'port',
  },
})
const port = +portString

const app = express()
app.set('views', path.resolve(__dirname, './views'))
app.set('view options', {
  rmWhitespace: true
})
app.set('view engine', 'ejs')

app.use(express.static(path.resolve(__dirname, '../build')))

app.get('/', (req, res) => {
  res.render('editor')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
