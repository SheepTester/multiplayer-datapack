import { createElement as e, FC, useState, Fragment, useRef, useEffect } from 'react'

import { Editor } from './components/Editor'
import { FileList } from './components/FileList'
import { ResizeHandle } from './components/ResizeHandle'
import { Sync } from './sync'

export const App: FC = () => {
  const [viewing, setViewing] = useState<string[]>([])
  const [fileListWidth, setFileListWidth] = useState<number>(350)

  const syncRef = useRef<Sync>()
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  function getSync (): Sync {
    if (!syncRef.current) {
      syncRef.current = new Sync()
    }
    return syncRef.current
  }
  useEffect(() => {
    return () => {
      if (syncRef.current) {
        syncRef.current.close()
      }
    }
  }, [])

  return e(
    Fragment,
    null,
    e(
      FileList,
      {
        sync: getSync(),
        onOpen (file) {
          if (!viewing.includes(file)) {
            setViewing([...viewing, file])
          }
        },
        width: fileListWidth,
      },
    ),
    e(
      ResizeHandle,
      {
        direction: 'horizontal',
        onResize ({ x }) {
          setFileListWidth(x)
        },
      },
    ),
    e(
      Editor,
      {
        file: 'whatever.json',
      },
    ),
  )
}
