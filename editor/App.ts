import { createElement as e, FC, useState, Fragment, useRef, useEffect } from 'react'

import { Editor } from './components/Editor'
import { FileList } from './components/FileList'
import { Sync } from './sync'

export const App: FC = () => {
  const [viewing, setViewing] = useState<string[]>([])

  const sync = useRef<Sync>()
  // HACK to force rerender
  const [, setWhatever] = useState<number>(0)
  useEffect(() => {
    sync.current = new Sync()
    setWhatever(Math.random())
    return () => {
      if (sync.current) {
        sync.current.close()
      }
    }
  }, [])

  return e(
    Fragment,
    null,
    sync.current && e(
      FileList,
      {
        sync: sync.current,
        onOpen (file) {
          if (!viewing.includes(file)) {
            setViewing([...viewing, file])
          }
        },
        width: 550,
      },
    ),
    e(
      Editor,
      {
        file: 'whatever.json',
      },
    ),
    viewing,
  )
}
