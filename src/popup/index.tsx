import React from 'react'
import { render } from 'react-dom'

import { ensureContentScriptLoadedInActiveTab } from '../chrome-utils'
import { Popup } from './Popup'
import './index.css'

/**
 * Check to see if our content script has been injected into the active tab.
 *
 * If it hasn't, then inject the content script + CSS.
 */
async function main() {
  await ensureContentScriptLoadedInActiveTab()
}

main()
render(<Popup />, document.querySelector('#root'))
