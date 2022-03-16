import { BlockRulesEngine } from './block-rules-engine'
import { defaultBlockRules } from './default-block-rules'

const blockRulesEngine = new BlockRulesEngine()

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (
    changeInfo.url &&
    blockRulesEngine.isBlockingEnabledForHost(new URL(changeInfo.url))
  ) {
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

      const { numBlockedItems, numBlockedLinks } = message

      const text =
        numBlockedItems + numBlockedLinks > 0
          ? `${numBlockedItems + numBlockedLinks}`
          : ''

      await Promise.all([
        chrome.action.setBadgeBackgroundColor({ color: '#646464' }),
        chrome.action.setBadgeText({ text, tabId })
      ])
      break

    case 'event:addBlockLinkRule':
      await blockRulesEngine.addBlockLinkRule({
        hostname: message.hostname,
        url: message.url
      })
      break

    case 'event:addBlockHostRule':
      await blockRulesEngine.addBlockHostRule({
        hostname: message.hostname
      })
      break
  }

  sendResponse()
  return true
})

chrome.runtime.onInstalled.addListener(() => {
  blockRulesEngine.addBlockRules(defaultBlockRules)
})
