import * as monaco from 'monaco-editor'

function notNull<T> (value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${value} to not be null.`)
  }
  return value
}

const editor = monaco.editor.create(notNull(document.getElementById('container')), {
  theme: 'vs-dark',
  language: window.location.pathname.endsWith('.json') || window.location.pathname.endsWith('.mcmeta')
    ? 'json'
    : window.location.pathname.endsWith('.mcfunction')
    ? 'mcfunction'
    : 'plaintext',
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
  tabSize: 2,
  insertSpaces: true,
})
window.addEventListener('resize', () => {
  editor.layout()
})

const model = notNull(editor.getModel())

const wsUrl = new URL('/wuss', window.location.href)
wsUrl.protocol = wsUrl.protocol === 'https' ? 'wss' : 'ws'
wsUrl.searchParams.set('from', window.location.pathname)
const ws = new WebSocket(wsUrl.toString())

ws.addEventListener('message', e => {
  const { type, ...data } = JSON.parse(e.data)
  switch (type) {
    case 'file': {
      model.setValue(data.file)
      break
    }
    case 'changes': {
      editor.executeEdits(null, data.changes)
      break
    }
  }
})

let changed = false
editor.onDidChangeModelContent(e => {
  // isFlush seems to mean that it's from setValue
  // https://github.com/microsoft/monaco-editor/issues/432#issuecomment-749198333
  if (!e.isFlush) {
    if (!changed) {
      changed = true
      document.title = 'datapack editor*'
    }
    // ws.send(JSON.stringify({
    //   type: 'changes',
    //   changes: e.changes,
    // }))
  }
})
editor.addAction({
  id: 'save',
  label: 'Save to server',
  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
  contextMenuGroupId: 'lol',
  contextMenuOrder: 2,
  run: () => {
    ws.send(JSON.stringify({
      type: 'file',
      file: model.getValue(),
    }))
    if (changed) {
      changed = false
      document.title = 'datapack editor'
    }
  },
})
window.addEventListener('beforeunload', e => {
  if (changed) {
    e.preventDefault()
    e.returnValue = ''
  }
})

// const fileList = notNull(document.getElementById('file-list'))
// window.addEventListener('message', e => {
//   window.location.href = e.data
// })
