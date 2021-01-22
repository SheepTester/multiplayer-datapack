import { createElement as e, FC, useState, Fragment, useRef, useEffect, useCallback } from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import classNames from 'classnames'

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
  const [name, setName] = useState<string>('')

  const [closed, setClosed] = useState<null | 'closed' | 'error'>(null)
  const syncRef = useRef<Sync>()
  // https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
  function getSync (): Sync {
    if (syncRef.current === undefined) {
      syncRef.current = new Sync()
    }
    return syncRef.current
  }
  useEffect(() => {
    const sync = getSync()
    const handleName = (name: string): void => {
      setName(name)
    }
    const handleClose = (err: boolean): void => {
      setClosed(err ? 'error' : 'closed')
    }
    sync.on('name', handleName)
    sync.on('close', handleClose)
    return () => {
      sync.off('name', handleName)
      sync.off('close', handleClose)
      sync.close()
    }
  }, [])

  const anyUnsaved: boolean = viewing.find(file => file.unsavedChanges) !== undefined
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
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

  // React annoyingly does not have an actual change event
  // https://github.com/facebook/react/issues/3964
  const inputRef = useCallback((inputNode: HTMLInputElement) => {
    const handleChange = (): void => {
      getSync().setName(inputNode.value)
      fetch('/set-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: inputNode.value,
        }),
      }).catch(console.error)
    }
    inputNode.addEventListener('change', handleChange)
    return () => {
      inputNode.removeEventListener('change', handleChange)
    }
  }, [])

  return e(
    Fragment,
    null,
    e(
      'div',
      {
        className: 'sidebar',
        style: {
          width: `${fileListWidth}px`,
        },
      },
      closed !== null && e(
        'div',
        {
          className: classNames('connection-closed', closed === 'error' && 'connection-error'),
        },
        closed === 'error'
          ? 'There was a problem connecting to the server.'
          : 'The connection with the server closed.',
      ),
      e(
        FileList,
        {
          sync: getSync(),
          onOpen ({ key }) {
            if (viewing.find(file => file.key === key) === undefined) {
              if (viewing.length > 0) {
                setViewing([
                  ...viewing.slice(0, tabIndex + 1),
                  { key, unsavedChanges: false },
                  ...viewing.slice(tabIndex + 1),
                ])
                setTabIndex(tabIndex + 1)
              } else {
                setViewing([{ key, unsavedChanges: false }])
                setTabIndex(0)
              }
            }
          },
        },
      ),
      e('span', { className: 'flex' }),
      e(
        'label',
        { className: 'name-input-wrapper' },
        'Name: ',
        e(
          'input',
          {
            className: 'name-input',
            type: 'text',
            value: name,
            // https://blaipratdesaba.com/react-typescript-cheatsheet-form-elements-and-onchange-event-types-8c2baf03230c
            onChange (e: React.ChangeEvent<HTMLInputElement>) {
              setName(e.target.value)
            },
            ref: inputRef,
          },
        ),
      ),
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
    viewing.length > 0
      ? e(
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
              '*',
            ),
            e(
              'button',
              {
                className: 'tab-close-btn',
                onClick (e: MouseEvent) {
                  e.stopPropagation()
                  if (unsavedChanges && !confirm('You have unsaved changes. Close file?')) return
                  setViewing(viewing.filter(file => file.key !== key))
                  if (tabIndex === viewing.length - 1) {
                    setTabIndex(viewing.length - 2)
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
              },
            },
          ),
        )),
      )
      : e(IntroEditor),
  )
}
