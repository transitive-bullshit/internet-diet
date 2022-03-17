import React from 'react'
import { render } from 'react-dom'

import { Popup } from './Popup'
import { contentScriptID } from '../definitions'
import './index.css'

/*
  Check to see if our content script has been injected into the active tab.

  If it hasn't, then inject the content script + CSS.
 */
async function main() {
  const [activeTab] = await chrome.tabs.query({
    currentWindow: true,
    active: true
  })

  const isTabPrivate = !!activeTab?.url?.startsWith('chrome')
  if (isTabPrivate) {
    // ignore internal chrome:// and chrome-extension:// pages
    return
  }

  if (activeTab?.id) {
    const tabId = activeTab.id

    console.time('content-script-check')
    const isContentLoaded = await new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: 'query:contentScriptID'
        },
        (result) => {
          console.log('content-script-check result', result)
          // we know this tab already has the content script loaded
          // we're ignoring the ID response since there can currently
          // only be one content script ID
          resolve(!!result)
        }
      )

      // TODO: using an arbitrary timeout here is a bit hacky and prone to error.
      // The content script includes a guard to prevent against duplicate scripts,
      // but in the future we should try to find a better way of tracking dynamic
      // script injection.
      setTimeout(() => resolve(false), 250)
    })
    console.timeEnd('content-script-check')

    if (isContentLoaded) {
      console.log(
        `content script "${contentScriptID}" already loaded in tab "${tabId}"`
      )
    } else {
      console.log(
        `loading content script "${contentScriptID}" in tab "${tabId}"`
      )

      try {
        await Promise.all([
          chrome.scripting.insertCSS({
            target: { tabId },
            files: ['content.css']
          }),

          chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
          })
        ])
      } catch (err) {
        console.error('error injecting content script', err)
      }
    }
  }
}

main()
render(<Popup />, document.querySelector('#root'))
