import { isBlockingEnabledForHost } from './utils'

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isBlockingEnabledForHost(new URL(changeInfo.url))) {
    chrome.tabs.sendMessage(tabId, {
      type: 'update'
    })
  }
})

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.type) {
    case 'tabBlockInfo':
      const tabId = sender?.tab?.id
      if (!tabId) {
        break
      }

      const { numBlockedItems, numBlockedLinks } = message.tabBlockInfo

      const text =
        numBlockedItems + numBlockedLinks > 0
          ? `${numBlockedItems + numBlockedLinks}`
          : ''

      await Promise.all([
        chrome.action.setBadgeBackgroundColor({ color: '#646464' }),
        chrome.action.setBadgeText({ text, tabId })
      ])
      break
  }

  sendResponse()
  return true
})
