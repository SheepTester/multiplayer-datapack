import { EventEmitter } from 'events'

import { Folder } from './components/Files'

export declare interface Sync {
  on (event: 'folders', listener: (folders: Folder) => void): this
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
      case 'folders': {
        this.emit('folders', data.folders)
        break
      }
    }
  }

  close () {
    this.ws.close()
  }
}
