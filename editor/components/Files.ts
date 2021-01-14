import { createElement as e, FC, useState, Fragment } from 'react'

export interface Folder {
  folders: [string, Folder][]
  files: [string, boolean][]
}

interface FileOrFolderProps {
  path: string
  name: string
  onClick: (path: string) => void
}

interface FileProps extends FileOrFolderProps {
  valid: boolean
}
const File: FC<FileProps> = ({ path, name, onClick, valid }: FileProps) => {
  return e(
    'button',
    { className: 'file', onClick: () => onClick(path) },
    name
  )
}

interface FolderProps extends FileOrFolderProps, Folder {
}
const Folder: FC<FolderProps> = ({ path, name, onClick, folders, files }: FolderProps) => {
  const [open, setOpen] = useState(true)
  return e(
    'div',
    { className: 'folder' },
    e(
      'button',
      { className: 'folder-name', onClick: () => setOpen(!open) },
      name,
    ),
    open && e(
      'div',
      { className: 'folder-contents file-items' },
      ...folders.map(([folderName, files]) => e(
        Folder,
        { path: path + folderName + '/', name: folderName, onClick, ...files },
      )),
      ...files.map(([fileName, valid]) => e(
        File,
        { path: path + fileName, name: fileName, onClick, valid },
      )),
    )
  )
}

interface Props {
  files: Folder
  onClick: (path: string) => void
}
export const Files: FC<Props> = ({ files: { folders, files }, onClick }: Props) => {
  return e(
    'div',
    {
      className: 'files-list file-items',
    },
    ...folders.map(([folderName, files]) => e(
      Folder,
      { path: folderName + '/', name: folderName, onClick, ...files },
    )),
    ...files.map(([fileName, valid]) => e(
      File,
      { path: fileName, name: fileName, onClick, valid },
    )),
  )
}
