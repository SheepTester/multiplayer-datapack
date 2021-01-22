import * as monaco from 'monaco-editor'

export const configuration: monaco.languages.LanguageConfiguration = {
  // the default separators except `@$`
  wordPattern: /(-?\d*\.\d\w*)|([^`~!#%^&*()-=+[{\]}\\|;:'",.<>/?\s]+)/g,
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['(', ')'],
    ['[', ']'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"' },
    { open: '\'', close: '\'' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"' },
    { open: '\'', close: '\'' },
  ],
}
