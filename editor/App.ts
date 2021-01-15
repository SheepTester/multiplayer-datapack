import { createElement as e, FC, useState, Fragment, useRef, useEffect } from 'react'
import FileBrowser, { FileBrowserFile } from 'react-keyed-file-browser'
import '../node_modules/react-keyed-file-browser/dist/react-keyed-file-browser.css'
import './overrides.css'

import { Editor } from './components/Editor'
import { Sync } from './sync'

export const App: FC = () => {
  const [files, setFiles] = useState<FileBrowserFile[]>([])

  console.log('a')
  useEffect(() => {
    console.log('b')
    const sync = new Sync()
    sync.on('files', files => {
      setFiles(files)
    })
    return () => {
      sync.close()
    }
  }, [])

  const handleRenameFile = (oldKey: string, newKey: string) => {
    console.log('handleRenameFile', oldKey, newKey)
    setFiles(files
      .map(file => file.key === oldKey
        ? { ...file, key: newKey }
        : file))
  }
  const handleRenameFolder = (oldKey: string, newKey: string) => {
    console.log('handleRenameFolder', oldKey, newKey)
    setFiles(files
      .map(file => file.key.startsWith(oldKey)
        ? { ...file, key: file.key.replace(oldKey, newKey) }
        : file))
  }

  return e(
    Fragment,
    null,
    e(
      'div',
      { className: 'file-list' },
      e(
        FileBrowser,
        {
          files,
          icons: {
            File: e('i', { className: 'codicon codicon-file-code', 'aria-hidden': true }),
            Image: e('i', { className: 'codicon codicon-file-media', 'aria-hidden': true }),
            Video: e('i', { className: 'codicon codicon-file-media', 'aria-hidden': true }),
            Audio: e('i', { className: 'codicon codicon-file-media', 'aria-hidden': true }),
            Archive: e('i', { className: 'codicon codicon-file-zip', 'aria-hidden': true }),
            Word: e('i', { className: 'codicon codicon-file', 'aria-hidden': true }),
            Excel: e('i', { className: 'codicon codicon-file', 'aria-hidden': true }),
            PowerPoint: e('i', { className: 'codicon codicon-file', 'aria-hidden': true }),
            Text: e('i', { className: 'codicon codicon-file-code', 'aria-hidden': true }),
            PDF: e('i', { className: 'codicon codicon-file-pdf', 'aria-hidden': true }),
            Rename: e('i', { className: 'codicon codicon-diff-renamed', 'aria-hidden': true }),
            Folder: e('i', { className: 'codicon codicon-folder', 'aria-hidden': true }),
            FolderOpen: e('i', { className: 'codicon codicon-folder-opened', 'aria-hidden': true }),
            Delete: e('i', { className: 'codicon codicon-trash', 'aria-hidden': true }),
            Loading: e('i', { className: 'codicon codicon-loading', 'aria-hidden': true }),
            Download: e('i', { className: 'codicon codicon-desktop-download', 'aria-hidden': true }),
          },
          onCreateFolder (key) {
            console.log('onCreateFolder', key)
            setFiles([...files, { key }])
          },
          onMoveFile: handleRenameFile,
          onMoveFolder: handleRenameFolder,
          onRenameFile: handleRenameFile,
          onRenameFolder: handleRenameFolder,
          onDeleteFile (fileKeys) {
            console.log('onDeleteFile', fileKeys)
            setFiles(files
              .filter(file => fileKeys.includes(file.key)))
          },
          onDeleteFolder (folderKeys) {
            console.log('onDeleteFolder', folderKeys)
            setFiles(files
              .filter(file => folderKeys
                .every(folderKey => !file.key.startsWith(folderKey))))
          },
        },
      ),
      e(
        'button',
        {
          className: 'create-file',
          onClick () {
            let name = 'new_file.mcfunction', i = 1
            while (files.find(file => file.key === name)) {
              i++
              name = `new_file_${i}.mcfunction`
            }
            setFiles([...files, { key: name, size: 0, modified: Date.now() }])
          }
        },
        e('i', { className: 'codicon codicon-new-file', 'aria-hidden': true }),
        ' Create file',
      )
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
