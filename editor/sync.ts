import { EventEmitter } from 'events'
import { FileBrowserFile } from 'react-keyed-file-browser'

export declare interface Sync {
  on (event: 'files', listener: (files: FileBrowserFile[]) => void): this
}

export class Sync extends EventEmitter {
  ws: WebSocket

  constructor () {
    super()
    const wsUrl = new URL('/wuss', window.location.href)
    wsUrl.protocol = wsUrl.protocol === 'https' ? 'wss' : 'ws'
    this.ws = new WebSocket(wsUrl.toString())
    this.ws.addEventListener('message', this.onMessage.bind(this))
  }

  onMessage (e: MessageEvent<any>) {
    const { type, ...data } = JSON.parse(e.data)
    switch (type) {
      case 'files': {
        this.emit('files', data.files)
        break
      }
    }
  }

  close () {
    this.ws.close()
  }
}
