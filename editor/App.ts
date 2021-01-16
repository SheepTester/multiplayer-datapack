import { createElement as e, FC, useState, Fragment, useRef, useEffect } from 'react'
import FileBrowser, { FileBrowserFile } from 'react-keyed-file-browser'
import '../node_modules/react-keyed-file-browser/dist/react-keyed-file-browser.css'
import './overrides.css'

import { Editor } from './components/Editor'
import { Sync } from './sync'

export const App: FC = () => {
  const [files, setFiles] = useState<FileBrowserFile[]>([])
  const [viewing, setViewing] = useState<string[]>([])
  const sync = useRef<Sync>()

  useEffect(() => {
    sync.current = new Sync()
    sync.current.on('files', files => {
      setFiles(files)
    })
    return () => {
      if (sync.current) {
        sync.current.close()
      }
    }
  }, [])

  const handleRenameFile = (oldKey: string, newKey: string) => {
    // Prevent renaming to existing file name
    if (!files.find(file => file.key === newKey)) {
      setFiles(files
        .map(file => file.key === oldKey
          ? { ...file, key: newKey }
          : file))
      if (sync.current) {
        sync.current.rearrangeFiles([{ type: 'move', oldKey, newKey }])
      }
    }
  }
  const handleRenameFolder = (oldKey: string, newKey: string) => {
    // Prevent folder move if folder already exists
    if (!files.find(file => file.key === newKey)) {
      setFiles(files
        .map(file => file.key.startsWith(oldKey)
          ? { ...file, key: file.key.replace(oldKey, newKey) }
          : file))
      if (sync.current) {
        sync.current.rearrangeFiles([{ type: 'move', oldKey, newKey }])
      }
    }
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
            Rename: e('i', { className: 'codicon codicon-tag', 'aria-hidden': true }),
            Folder: e('i', { className: 'codicon codicon-folder', 'aria-hidden': true }),
            FolderOpen: e('i', { className: 'codicon codicon-folder-opened', 'aria-hidden': true }),
            Delete: e('i', { className: 'codicon codicon-trash', 'aria-hidden': true }),
            Loading: e('i', { className: 'codicon codicon-loading', 'aria-hidden': true }),
            Download: e('i', { className: 'codicon codicon-desktop-download', 'aria-hidden': true }),
          },
          onCreateFolder (key) {
            setFiles([...files, { key }])
            if (sync.current) {
              sync.current.rearrangeFiles([{ type: 'create', key }])
            }
          },
          onMoveFile: handleRenameFile,
          onMoveFolder: handleRenameFolder,
          onRenameFile: handleRenameFile,
          onRenameFolder: handleRenameFolder,
          onDeleteFile (fileKeys) {
            setFiles(files
              .filter(file => !fileKeys.includes(file.key)))
            if (sync.current) {
              sync.current.rearrangeFiles(fileKeys.map(key => ({ type: 'delete', key })))
            }
          },
          onDeleteFolder (folderKeys) {
            setFiles(files
              .filter(file => folderKeys
                .every(folderKey => !file.key.startsWith(folderKey))))
            if (sync.current) {
              sync.current.rearrangeFiles(folderKeys.map(key => ({ type: 'delete', key })))
            }
          },
          noFilesMessage: ' Folder is empty',
          onPreviewOpen (file) {
            if (!viewing.includes(file.key)) {
              setViewing([...viewing, file.key])
            }
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
            if (sync.current) {
              sync.current.rearrangeFiles([{ type: 'create', key: name }])
            }
          }
        },
        e('i', { className: 'codicon codicon-new-file', 'aria-hidden': true }),
        ' Create file',
      )
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
