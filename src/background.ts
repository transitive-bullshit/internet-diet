import { BlockRulesEngine } from './block-rules-engine'
import { defaultBlockRules } from './default-block-rules'
import { getStableObjectHash } from './utils'
import { contentScriptID } from './definitions'

const blockRulesEngine = new BlockRulesEngine()
let cachedHostnamesHash: string

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

async function updateRegisteredContentScripts() {
  const hostnames = blockRulesEngine.getHostnames()
  const hostnamesHash = await getStableObjectHash(hostnames)
  if (hostnamesHash === cachedHostnamesHash) {
    console.log('updateRegisteredContentScripts deduped', cachedHostnamesHash)
    return
  }

  const script = {
    id: contentScriptID,
    // matches: ['<all_urls>'], // useful for debugging
    matches: hostnames.flatMap((hostname) => [
      `*://${hostname}/*`,
      `*://*.${hostname}/*`
    ]),
    js: ['content.js'],
    css: ['content.css'],
    runAt: 'document_start'
  }

  console.log(
    'updateRegisteredContentScripts registering script',
    script,
    hostnamesHash
  )
  await (chrome.scripting as any).unregisterContentScripts()
  await (chrome.scripting as any).registerContentScripts([script])
  cachedHostnamesHash = hostnamesHash
}

blockRulesEngine.on('update', updateRegisteredContentScripts)
