import { createElement as e, FC, useState, Fragment, useRef, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'

import { Editor, IntroEditor } from './components/Editor'
import { FileList } from './components/FileList'
import { ResizeHandle } from './components/ResizeHandle'
import { Sync } from './sync'

interface ViewingFile {
  key: string
  unsavedChanges: boolean
}

export const App: FC = () => {
  const [fileListWidth, setFileListWidth] = useState<number>(350)
  const [viewing, setViewing] = useState<ViewingFile[]>([])
  const [tabIndex, setTabIndex] = useState<number>(0)

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

  const anyUnsaved: boolean = !!viewing.find(file => file.unsavedChanges)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (anyUnsaved) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [anyUnsaved])

  console.log('Rendering with tabIndex', tabIndex)
  return e(
    Fragment,
    null,
    e(
      FileList,
      {
        sync: getSync(),
        onOpen ({ key }) {
          if (!viewing.find(file => file.key === key)) {
            if (viewing.length) {
              setViewing([
                ...viewing.slice(0, tabIndex + 1),
                { key, unsavedChanges: false },
                ...viewing.slice(tabIndex + 1),
              ])
              setTabIndex(tabIndex + 1)
              console.log('setTabIndex', tabIndex + 1, 'FileList.onOpen')
            } else {
              setViewing([{ key, unsavedChanges: false }])
              setTabIndex(0)
              console.log('setTabIndex', 0, 'FileList.onOpen')
            }
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
    viewing.length ? e(
      Tabs,
      {
        className: 'editors',
        selectedIndex: tabIndex,
        onSelect (index) {
          setTabIndex(index)
          console.log('setTabIndex', index, 'Tabs.onSelect')
        },
      },
      e(
        TabList,
        {
          className: 'editor-tabs',
        },
        viewing.map(({ key, unsavedChanges }) => e(
          Tab,
          {
            key,
            className: 'editor-tab',
            selectedClassName: 'editor-tab-selected',
          },
          key,
          e(
            'span',
            {
              style: {
                display: unsavedChanges ? null : 'none',
              },
            },
            '*'
          ),
          e(
            'button',
            {
              className: 'tab-close-btn',
              onClick () {
                if (unsavedChanges && !confirm('You have unsaved changes. Close file?')) return
                setViewing(viewing.filter(file => file.key !== key))
                if (tabIndex === viewing.length - 1) {
                  setTabIndex(viewing.length - 2)
                  console.log('setTabIndex', viewing.length - 2, 'button.onClick')
                }
              },
            },
            '×',
          ),
        )),
      ),
      viewing.map(({ key }) => e(
        TabPanel,
        {
          key,
          className: 'editor-tab-content',
          selectedClassName: 'editor-tab-content-showing',
          forceRender: true,
        },
        e(
          Editor,
          {
            sync: getSync(),
            file: key,
            onChangeUnsavedChanges (unsavedChanges) {
              setViewing(viewing.map(file =>
                file.key === key
                  ? { ...file, unsavedChanges }
                  : file))
            }
          },
        )
      )),
    ) : e(IntroEditor),
  )
}
