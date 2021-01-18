import { createElement as e, FC, useRef, useState, useEffect, Fragment, useCallback } from 'react'
import * as monaco from 'monaco-editor'
import MonacoEditor from 'react-monaco-editor'

import { Sync } from '../sync'

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

interface Props {
  sync: Sync
  file: string
  onChangeUnsavedChanges: (unsavedChanges: boolean) => void
}

export const Editor: FC<Props> = ({ sync, file, onChangeUnsavedChanges }: Props) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()

  // Unmodified file content
  const [content, setContent] = useState<string>('')
  // Modified file content in editor
  const [value, setValue] = useState<string>('')

  const [editing, setEditing] = useState<boolean>(false)
  const [valid, setValid] = useState<boolean>(true)

  const handleFileContent = useCallback((key: string, newContent: string | null, editing: boolean) => {
    if (key !== file) return
    if (newContent !== null) {
      setContent(newContent)
      setValue(value => content === value ? newContent : value)
      setValid(true)
    } else {
      setValid(false)
    }
    setEditing(editing)
  }, [content])

  useEffect(() => {
    sync.on('file-content', handleFileContent)
    return () => {
      sync.off('file-content', handleFileContent)
    }
  }, [handleFileContent])

  useEffect(() => {
    const handleNowEditor = (key: string) => {
      if (key === file) {
        setEditing(true)
      }
    }
    const handleNotEditor = (key: string) => {
      if (key === file) {
        setEditing(false)
      }
    }
    sync.on('now-editor', handleNowEditor)
    sync.on('not-editor', handleNotEditor)
    sync.subscribeToFile(file)
    return () => {
      sync.off('now-editor', handleNowEditor)
      sync.off('not-editor', handleNotEditor)
      sync.unsubscribeFromFile(file)
    }
  }, [file])

  const handleSaveRef = useRef<() => void>()
  useEffect(() => {
    handleSaveRef.current = () => {
      if (editing && editorRef.current) {
        sync.saveFile(file, editorRef.current.getValue())
        onChangeUnsavedChanges(false)
        setContent(editorRef.current.getValue())
      }
    }
  }, [editing])

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
                if (handleSaveRef.current) {
                  handleSaveRef.current()
                }
              }
            })
          },
          onChange (value) {
            setValue(value)
            onChangeUnsavedChanges(value !== content)
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
            className: 'file-notice-btn',
            onClick () {
              sync.claimEdit(file)
            },
          },
          'Claim editor',
        ),
      ) : e(
        'span',
        null,
        'You\'re the sole editor of this file.',
        e(
          'button',
          {
            className: 'file-notice-btn',
            onClick () {
              sync.unclaimEdit(file)
            },
            title: 'Unclaim editor role',
          },
          'Abdicate throne',
        ),
      ),
      value !== content && e(
        'button',
        {
          className: 'file-notice-btn',
          onClick () {
            setValue(content)
            onChangeUnsavedChanges(false)
          },
        },
        'Reset changes',
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
