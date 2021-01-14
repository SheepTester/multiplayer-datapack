import { createElement as e, FC, useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import MonacoEditor from 'react-monaco-editor'

import { notNull } from '../utils'

interface Props {
  language: 'json' | 'mcfunction' | 'plaintext'
}

export const Editor: FC<Props> = ({ language }: Props) => {
  return e(
    MonacoEditor,
    {
      language,
      options: {
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
      },
    },
  )
}
