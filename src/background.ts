import { BlockRulesEngine } from './block-rules-engine'
import { SettingsStore } from './settings-store'
import { defaultBlockRules } from './default-block-rules'
import {
  ensureContentScriptLoadedInActiveTab,
  updateRegisteredContentScripts
} from './chrome-utils'

const blockRulesEngine = new BlockRulesEngine()
const settingsStore = new SettingsStore()

chrome.runtime.onInstalled.addListener(() => {
  blockRulesEngine.addBlockRules(defaultBlockRules)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    let url: URL
    try {
      url = new URL(changeInfo.url)
    } catch (err) {
      // invalid url
      return
    }

    if (blockRulesEngine.isBlockingEnabledForHost(url)) {
      chrome.tabs.sendMessage(tabId, {
        type: 'update'
      })
    }
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ;(async () => {
    switch (message.type) {
      case 'tabBlockInfo': {
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
      }

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
  })()

  return true
})

chrome.commands.onCommand.addListener(async (command) => {
  console.log('received command', command)

  switch (command) {
    case 'toggle-blocking':
      await settingsStore.toggleIsPaused()
      break

    case 'add-block-link-rule-to-page': {
      const activeTab = await ensureContentScriptLoadedInActiveTab()
      console.debug('command', command, activeTab)

      chrome.tabs.sendMessage(
        activeTab.id!,
        {
          type: 'event:updateIsAddingLinkBlock',
          isAddingLinkBlock: true
        },
        () => {
          // TODO
        }
      )
      break
    }

    case 'remove-block-link-rule-from-page': {
      const activeTab = await ensureContentScriptLoadedInActiveTab()
      console.debug('command', command, activeTab)

      // TODO
      console.warn('TODO', command)
      break
    }
  }
})

blockRulesEngine.on('update', () =>
  updateRegisteredContentScripts(blockRulesEngine)
)
