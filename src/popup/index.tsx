import React from 'react'
import { render } from 'react-dom'

import { Popup } from './Popup'
import { contentScriptID } from '../definitions'
import './index.css'

async function main() {
  const [activeTab] = await chrome.tabs.query({
    currentWindow: true,
    active: true
  })

  if (activeTab?.id) {
    const tabId = activeTab.id

    console.time('content-script-check')
    const isContentLoaded = await new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: 'query:contentScriptID'
        },
        () => {
          // we know this tab already has the content script loaded
          // we're ignoring the ID response since there can currently
          // only be one content script ID
          resolve(true)
        }
      )

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
    }
  }
}

main()
render(<Popup />, document.querySelector('#root'))
