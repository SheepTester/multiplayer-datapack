import { createElement as e, FC, useState, Fragment, useRef, useEffect } from 'react'

import { Editor } from './components/Editor'
import { Files, Folder } from './components/Files'
import { Sync } from './sync'

export const App: FC = () => {
  const [files, setFiles] = useState<Folder>({ folders: [], files: [] })

  useEffect(() => {
    const sync = new Sync()
    sync.on('folders', folders => {
      setFiles(folders)
    })
    return () => {
      sync.close()
    }
  }, [])

  return e(
    Fragment,
    null,
    e(
      Files,
      {
        files,
        onClick: console.log,
      },
    ),
    e(
      Editor,
      {
        language: window.location.pathname.endsWith('.json') || window.location.pathname.endsWith('.mcmeta')
          ? 'json'
          : window.location.pathname.endsWith('.mcfunction')
          ? 'mcfunction'
          : 'plaintext'
      },
    ),
  )
}
