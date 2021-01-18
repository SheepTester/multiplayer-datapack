import { StrictMode, createElement as e } from 'react'
import * as ReactDOM from 'react-dom'

import { App } from './App'

ReactDOM.render(
  e(
    StrictMode,
    null,
    e(App),
  ),
  document.getElementById('root'),
)
