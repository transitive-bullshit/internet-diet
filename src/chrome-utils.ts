import { contentScriptID } from './definitions'

/**
 * Checks if our content script has been injected into the current active tab.
 *
 * If it hasn't, then inject the content script + CSS.
 */
export async function ensureContentScriptLoadedInActiveTab() {
  const [activeTab] = await chrome.tabs.query({
    currentWindow: true,
    active: true
  })

  await ensureContentScriptLoadedInTab(activeTab)
  return activeTab
}

/**
 * Checks if our content script has been injected into a given tab.
 *
 * If it hasn't, then inject the content script + CSS.
 */
export async function ensureContentScriptLoadedInTab(tab: chrome.tabs.Tab) {
  const isTabPrivate = !!tab?.url?.startsWith('chrome')
  if (isTabPrivate) {
    // ignore internal chrome:// and chrome-extension:// pages
    return
  }

  if (tab?.id) {
    const tabId = tab.id

    console.time('content-script-check')
    const isContentLoaded = await new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: 'query:contentScriptID'
        },
        (result) => {
          console.log(
            'content-script-check result',
            result,
            chrome.runtime.lastError
          )
          resolve(!!result)
        }
      )

      // TODO: using an arbitrary timeout here is hacky and error-prone.
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
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
          }),

          chrome.scripting.insertCSS({
            target: { tabId },
            files: ['content.css']
          })
        ])
      } catch (err) {
        console.error('error injecting content script', err)
        throw err
      }
    }
  }
}
