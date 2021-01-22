import minimist from 'minimist'
import fs from 'fs-extra'

const {
  port: portString = '8080',
  base = './data/',
  extensions = '.mcfunction,.json,.mcmeta,.txt,.md',
  debug = null,
  help = false,
} = minimist(process.argv.slice(2), {
  string: [
    'port',
    'base',
    'extensions',
    'debug',
  ],
  boolean: [
    'help',
  ],
  alias: {
    p: 'port',
    b: 'base',
    e: 'extensions',
    h: 'help',
  },
})

if (help as boolean) {
  console.log('npm start -- [options]')
  console.log('Options:')
  console.log('--port <port> (-p <port>)\n\tSets the port for the server. (Default: 8080)')
  console.log('--base <path> (-b <path>)\n\tSpecify the path to the directory containing the datapack files you want to make editable. (Default: data/)')
  console.log('--extensions <exts> (-e <exts>)\n\tA comma-separated list of file extensions that can be edited. (Default: .mcfunction,.json,.mcmeta)')
  console.log('--help (-h)\n\tShow help and exit')
  process.exit()
}

fs.ensureDirSync(base)

export const port: number = +portString
export const baseDir: string = base
export const safeExtensions: RegExp = new RegExp(`(${
  (extensions as string)
    .replace(/\./g, '\\.')
    .replace(/,/g, '|')
})$`)
export const debugSrc: string | null = debug
