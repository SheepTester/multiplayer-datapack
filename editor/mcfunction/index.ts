import * as monaco from 'monaco-editor'

import { tokens } from './monarch-tokens'
import { configuration } from './configuration'

export function register (): void {
  monaco.languages.register({ id: 'mcfunction' })
  monaco.languages.setMonarchTokensProvider('mcfunction', tokens)
  monaco.languages.setLanguageConfiguration('mcfunction', configuration)
}
