import { createElement as e, FC, useEffect, useState } from 'react'
import FileBrowser, { FileBrowserFile } from 'react-keyed-file-browser'
import '../../node_modules/react-keyed-file-browser/dist/react-keyed-file-browser.css'
import './file-list-overrides.css'

import { Sync } from '../sync'

interface Props {
  sync: Sync
  onOpen: (file: FileBrowserFile) => void
}

export const FileList: FC<Props> = ({ sync, onOpen }: Props) => {
  const [files, setFiles] = useState<FileBrowserFile[]>([])

  useEffect(() => {
    const onFiles = (files: FileBrowserFile[]): void => {
      setFiles(files)
    }
    sync.on('files', onFiles)
    return () => {
      sync.off('files', onFiles)
    }
  }, [sync])

  const handleRenameFile = (oldKey: string, newKey: string): void => {
    // Prevent renaming to existing file name
    if (files.find(file => file.key === newKey) !== undefined) {
      setFiles(files
        .map(file => file.key === oldKey
          ? { ...file, key: newKey }
          : file))
      sync.rearrangeFiles([{ type: 'move', oldKey, newKey }])
    }
  }
  const handleRenameFolder = (oldKey: string, newKey: string): void => {
    // Prevent folder move if folder already exists
    if (files.find(file => file.key === newKey) !== undefined) {
      setFiles(files
        .map(file => file.key.startsWith(oldKey)
          ? { ...file, key: file.key.replace(oldKey, newKey) }
          : file))
      sync.rearrangeFiles([{ type: 'move', oldKey, newKey }])
    }
  }

  return e(
    'div',
    {
      className: 'file-list',
    },
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
          sync.rearrangeFiles([{ type: 'create', key }])
        },
        onMoveFile: handleRenameFile,
        onMoveFolder: handleRenameFolder,
        onRenameFile: handleRenameFile,
        onRenameFolder: handleRenameFolder,
        onDeleteFile (fileKeys) {
          setFiles(files
            .filter(file => !fileKeys.includes(file.key)))
          sync.rearrangeFiles(fileKeys.map(key => ({ type: 'delete', key })))
        },
        onDeleteFolder (folderKeys) {
          setFiles(files
            .filter(file => folderKeys
              .every(folderKey => !file.key.startsWith(folderKey))))
          sync.rearrangeFiles(folderKeys.map(key => ({ type: 'delete', key })))
        },
        onPreviewOpen (file) {
          onOpen(file)
        },
      },
    ),
    e(
      'button',
      {
        className: 'create-file',
        onClick () {
          let name = 'new_file.mcfunction'; let i = 1
          while (files.find(file => file.key === name) !== undefined) {
            i++
            name = `new_file_${i}.mcfunction`
          }
          setFiles([...files, { key: name, size: 0, modified: Date.now() }])
          sync.rearrangeFiles([{ type: 'create', key: name }])
        },
      },
      e('i', { className: 'codicon codicon-new-file', 'aria-hidden': true }),
      ' Create file',
    ),
  )
}
