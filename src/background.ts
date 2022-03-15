import { isBlockingEnabledForHost } from './utils'

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isBlockingEnabledForHost(new URL(changeInfo.url))) {
    chrome.tabs.sendMessage(tabId, {
      message: 'update'
    })
  }
})

chrome.runtime.onMessage.addListener(async (request, sender) => {
  switch (request.message) {
    case 'tabBlockUpdate':
      const tabId = sender?.tab?.id
      if (!tabId) {
        break
      }

      const text =
        request.numBlockedItems + request.numBlockedLinks > 0
          ? `${request.numBlockedItems + request.numBlockedLinks}`
          : ''

      await Promise.all([
        chrome.action.setBadgeBackgroundColor({ color: '#646464' }),
        chrome.action.setBadgeText({ text, tabId })
      ])
      break
  }
})
