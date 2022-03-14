import { isBlockingEnabledForHost } from './utils'

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isBlockingEnabledForHost(new URL(changeInfo.url))) {
    console.log('change', changeInfo.url)
    console.log('redirecting', chrome.runtime.getURL('./blocked.html'))

    chrome.tabs.sendMessage(tabId, {
      message: 'update',
      url: changeInfo.url
    })
  }
})
