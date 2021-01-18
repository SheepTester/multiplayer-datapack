import { FileBrowserFile } from 'react-keyed-file-browser'
import { TypedEmitter } from 'tiny-typed-emitter'

import { Rearrangement } from '../common/common'

interface SyncEvents {
  files: (files: FileBrowserFile[]) => void
  'file-content': (key: string, content: string | null, editing: boolean) => void
  'not-editor': (key: string) => void
  'now-editor': (key: string) => void
  'name': (name: string) => void
  'close': (err: boolean) => void
}

export class Sync extends TypedEmitter<SyncEvents> {
  ws: WebSocket
  open: Promise<void>

  constructor () {
    super()
    const wsUrl = new URL('/wuss', window.location.href)
    wsUrl.protocol = wsUrl.protocol === 'https' ? 'wss' : 'ws'
    this.ws = new WebSocket(wsUrl.toString())
    this.open = new Promise(resolve => {
      this.ws.addEventListener('open', () => resolve())
    })
    this.ws.addEventListener('message', this.onMessage.bind(this))
    this.ws.addEventListener('close', () => {
      this.emit('close', false)
    })
    this.ws.addEventListener('error', () => {
      this.emit('close', true)
    })
  }

  onMessage (e: MessageEvent<any>) {
    const { type, ...data } = JSON.parse(e.data)
    switch (type) {
      case 'files': {
        this.emit('files', data.files)
        break
      }
      case 'file-content': {
        this.emit('file-content', data.key, data.content, data.editing)
        break
      }
      case 'not-editor': {
        this.emit('not-editor', data.key)
        break
      }
      case 'now-editor': {
        this.emit('now-editor', data.key)
        break
      }
      case 'name': {
        this.emit('name', data.name)
        break
      }
      default: {
        console.error('Unknown message type', type, data)
      }
    }
  }

  rearrangeFiles (changes: Rearrangement[]) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'rearrange',
        changes,
      }))
    })
  }

  subscribeToFile (key: string) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'open',
        key,
      }))
    })
  }

  unsubscribeFromFile (key: string) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'close',
        key,
      }))
    })
  }

  claimEdit (key: string) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'claim-edit',
        key,
      }))
    })
  }

  unclaimEdit (key: string) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'unclaim-edit',
        key,
      }))
    })
  }

  saveFile (key: string, content: string) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'save',
        key,
        content,
      }))
    })
  }

  setName (name: string) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'name',
        name,
      }))
    })
  }

  close () {
    this.ws.close()
  }
}
