import minimist from 'minimist'

const {
  port: portString = '8080',
  base = './data/',
  extensions = '.mcfunction,.json,.mcmeta',
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

if (help) {
  console.log('TODO: help')
}

export const port: number = +portString
export const baseDir: string = base
export const safeExtensions: RegExp = new RegExp(
  extensions
    .replace(/\./g, '\\.')
    .replace(/,/g, '|')
)
export const debugUrl: string | null = debug
