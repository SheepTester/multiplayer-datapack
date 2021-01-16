import { EventEmitter } from 'events'
import { FileBrowserFile } from 'react-keyed-file-browser'
import { TypedEmitter } from 'tiny-typed-emitter'

import { Rearrangements } from '../common/common'

interface SyncEvents {
  files: (files: FileBrowserFile[]) => void
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
  }

  onMessage (e: MessageEvent<any>) {
    const { type, ...data } = JSON.parse(e.data)
    switch (type) {
      case 'files': {
        this.emit('files', data.files)
        break
      }
      default: {
        console.error('Unknown message type', data)
      }
    }
  }

  rearrangeFiles (changes: Rearrangements[]) {
    this.open.then(() => {
      this.ws.send(JSON.stringify({
        type: 'rearrange',
        changes,
      }))
    })
  }

  close () {
    this.ws.close()
  }
}
