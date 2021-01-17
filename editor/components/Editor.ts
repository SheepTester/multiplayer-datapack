import { createElement as e, FC, useRef, useState, useEffect, Fragment } from 'react'
import * as monaco from 'monaco-editor'
import MonacoEditor from 'react-monaco-editor'

import { Sync } from '../sync'

interface Props {
  sync: Sync
  file: string
}

function getLanguage (fileName: string): string {
  return fileName.endsWith('.json') || fileName.endsWith('.mcmeta')
    ? 'json'
    : fileName.endsWith('.mcfunction')
    ? 'mcfunction'
    : 'plaintext'
}

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark',
  // What full autoindent means:
  // https://code.visualstudio.com/docs/getstarted/settings
  autoIndent: 'full',
  formatOnType: true,
  formatOnPaste: true,
  glyphMargin: true,
  fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
  fontLigatures: '"ss06"',
  tabCompletion: 'on',
  wordWrap: 'on',
  showUnused: true,
  tabSize: 2,
  insertSpaces: true,
}

export const Editor: FC<Props> = ({ sync, file }: Props) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()
  const [value, setValue] = useState<string>('')
  const [editing, setEditing] = useState<boolean>(false)
  const [valid, setValid] = useState<boolean>(true)

  useEffect(() => {
    const onFileContent = (key: string, content: string | null, editing: boolean) => {
      if (key !== file) return
      if (content !== null) {
        setValue(content)
        setValid(true)
      } else {
        setValid(false)
      }
      setEditing(editing)
    }
    const onNowEditor = (key: string) => {
      if (key === file) {
        setEditing(true)
      }
    }
    const onNotEditor = (key: string) => {
      if (key === file) {
        setEditing(false)
      }
    }
    sync.on('file-content', onFileContent)
    sync.on('now-editor', onNowEditor)
    sync.on('not-editor', onNotEditor)
    sync.subscribeToFile(file)
    return () => {
      sync.off('file-content', onFileContent)
      sync.off('now-editor', onNowEditor)
      sync.off('not-editor', onNotEditor)
      sync.unsubscribeFromFile(file)
    }
  }, [])

  return e(
    Fragment,
    null,
    e(
      'div',
      { className: 'editor-wrapper' },
      e(
        MonacoEditor,
        {
          language: getLanguage(file),
          options: {
            ...editorOptions,
            readOnly: !editing,
          },
          value,
          editorDidMount (editor) {
            editorRef.current = editor

            editor.addAction({
              id: 'save',
              label: 'Save file',
              keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
              contextMenuGroupId: 'datapack',
              contextMenuOrder: 2,
              run: () => {
                sync.saveFile(file, editor.getValue())
              }
            })
          },
        },
      ),
    ),
    e(
      'div',
      { className: 'file-notice' },
      !valid ? e(
        'span',
        { className: 'invalid-file' },
        'You are not allowed to edit this file.',
      ) : !editing ? e(
        'span',
        null,
        'You currently aren\'t the editor of this file.',
        e(
          'button',
          {
            className: 'claim-edit-btn',
            onClick () {
              sync.claimEdit(file)
            },
          },
          'Claim editor'
        ),
      ) : e(
        'span',
        null,
        'You\'re the sole editor of this file.',
        e(
          'button',
          {
            className: 'claim-edit-btn',
            onClick () {
              sync.unclaimEdit(file)
            },
            title: 'Unclaim editor role',
          },
          'Abdicate throne',
        ),
      ),
    ),
  )
}

// An editor needs to be loaded at the start for the codicons to work.
export const IntroEditor: FC = () => {
  return e(
    MonacoEditor,
    {
      language: 'plaintext',
      options: {
        ...editorOptions,
        readOnly: true,
      },
      value: 'Select a file on the left to start editing.',
    },
  )
}
