import './style.css'

import * as monaco from 'monaco-editor'

function notNull<T> (value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${value} to not be null.`)
  }
  return value
}

const editor = monaco.editor.create(notNull(document.getElementById('container')), {
  // theme: 'material',
  // language: 'n',
  // What full autoindent means:
  // https://code.visualstudio.com/docs/getstarted/settings
  autoIndent: 'full',
  formatOnType: true,
  formatOnPaste: true,
  glyphMargin: true,
  fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
  fontLigatures: '"ss06"',
  tabCompletion: 'on',
  wordWrap: 'on',
  showUnused: true,
  tabSize: 4,
  insertSpaces: false,
})
console.log('hello')
console.log(editor)
editor.onDidChangeModelContent(e => {
  console.log(e)
})
window.addEventListener('resize', () => {
  editor.layout()
})
