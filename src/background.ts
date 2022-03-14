import { isBlockingEnabledForHost } from './utils'

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isBlockingEnabledForHost(new URL(changeInfo.url))) {
    chrome.tabs.sendMessage(tabId, {
      message: 'update',
      url: changeInfo.url
    })
  }
})
