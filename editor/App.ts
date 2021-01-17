import { createElement as e, FC, useState, Fragment, useRef, useEffect } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'

import { Editor, IntroEditor } from './components/Editor'
import { FileList } from './components/FileList'
import { ResizeHandle } from './components/ResizeHandle'
import { Sync } from './sync'

export const App: FC = () => {
  const [fileListWidth, setFileListWidth] = useState<number>(350)
  const [viewing, setViewing] = useState<string[]>([])
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

  return e(
    Fragment,
    null,
    e(
      FileList,
      {
        sync: getSync(),
        onOpen ({ key }) {
          if (!viewing.includes(key)) {
            if (viewing.length) {
              setViewing([
                ...viewing.slice(0, tabIndex + 1),
                key,
                ...viewing.slice(tabIndex + 1),
              ])
              setTabIndex(tabIndex + 1)
            } else {
              setViewing([key])
              setTabIndex(0)
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
        },
      },
      e(
        TabList,
        {
          className: 'editor-tabs',
        },
        viewing.map(file => e(
          Tab,
          {
            key: file,
            className: 'editor-tab',
            selectedClassName: 'editor-tab-selected',
          },
          file,
          e(
            'button',
            {
              className: 'tab-close-btn',
              onClick () {
                setViewing(viewing.filter(key => key !== file))
                if (tabIndex === viewing.length - 1) {
                  setTabIndex(viewing.length - 2)
                }
              },
            },
            '×',
          ),
        )),
      ),
      viewing.map(file => e(
        TabPanel,
        {
          key: file,
          className: 'editor-wrapper',
          selectedClassName: 'editor-wrapper-showing',
          forceRender: true,
        },
        e(
          Editor,
          {
            file,
          },
        )
      )),
    ) : e(IntroEditor),
  )
}
