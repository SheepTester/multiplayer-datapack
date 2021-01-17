import { createElement as e, FC, useRef } from 'react'
import * as monaco from 'monaco-editor'
import MonacoEditor from 'react-monaco-editor'

interface Props {
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

export const Editor: FC<Props> = ({ file }: Props) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()

  return e(
    MonacoEditor,
    {
      language: getLanguage(file),
      options: {
        ...editorOptions,
      },
      editorDidMount (editor) {
        editorRef.current = editor
      },
    },
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
