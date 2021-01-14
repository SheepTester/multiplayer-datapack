import { StrictMode, createElement as e } from 'react'
import * as ReactDOM from 'react-dom'

import { App } from './App'

ReactDOM.render(
  e(
    StrictMode,
    null,
    e(App),
  ),
  document.getElementById('root'),
)

/*
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
*/

// const fileList = notNull(document.getElementById('file-list'))
// window.addEventListener('message', e => {
//   window.location.href = e.data
// })
