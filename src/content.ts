import select from 'select-dom'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'
import type toast from 'react-hot-toast'

import { BlockRulesEngine } from './block-rules-engine'
import { SettingsStore } from './settings-store'
import { StatsStore } from './stats-store'
import {
  getBestLinkBlockCandidate,
  getClosestLinkBlockCandidate,
  getClosestItemBlockCandidate
} from './url-utils'
import {
  contentScriptID,
  selectedNodeClassName,
  blockedNodeClassName,
  blockEffectBlurClassName,
  blockEffectHideClassName
} from './definitions'
import * as log from './log'

/*
  Guard against multiple copies of the content script being dynamically injected.

  When the extension's action is triggered, the popup script will attempt to send a
  message to the currently active tab's content script. If it doesn't get a response
  within a brief period of time, it will inject the content script into that page.

  Most of the time, this check works as intended, but this guard exists just in case
  it fails, in which case multiple copies of the content script are injected. This
  edge case has been manually tested to work fine since duplicate scripts bail out
  with this guard (by throwing an error), but it is not a very clean solution.

  The reason we're going with this approach, however, is to only inject the content
  script into pages that either have active blocking rules or where the user has
  manually invoked the extension's page action. In other words, we are trying to
  dynamically inject our content script into as few tabs as possible instead of
  statically injecting it into every tab up front.
*/
if ((window as any)[contentScriptID]) {
  log.warn('loaded duplicate content script', contentScriptID)
  throw new Error(`duplicate ${contentScriptID}`)
} else {
  log.debug('loaded content script', contentScriptID)
  ;(window as any)[contentScriptID] = true
}

const blockRulesEngine = new BlockRulesEngine()
const settingsStore = new SettingsStore()
const statsStore = new StatsStore()

let mutationObserver: MutationObserver | null = null
let selectedElement: HTMLElement | null = null
let selectedLink: HTMLAnchorElement | null = null
let selectedLinkOldHref: string | null = null
let selectedLinkOldOnClick: any | null = null
let selectedElementOldOnClick: any | null = null
let tabBlockInfo = {
  numBlockedLinks: 0,
  numBlockedItems: 0
}
let isAddingLinkBlock = false
let isAddingLinkBlockToastId: string | null = null
let createToast: typeof toast

function hideBlockedLinks() {
  const links = select.all('a')

  let numBlockedLinks = 0
  let numBlockedLinksFresh = 0

  for (const link of links) {
    if (blockRulesEngine.isUrlBlockedAsString(link.href)) {
      // TODO: should getBestLinkBlockCandidate take the original link / href into
      // account here? (not sure it matters, but might be a good way to force using
      // that normalizedUrl)
      const candidate = getBestLinkBlockCandidate(link)
      const element = candidate?.element || getClosestLinkBlockCandidate(link)
      if (hideElement(element)) {
        ++numBlockedLinksFresh
      }

      ++numBlockedLinks
    }
  }

  return { numBlockedLinks, numBlockedLinksFresh }
}

function hideBlockedItems() {
  const items = select.all('li')

  let numBlockedItems = 0
  let numBlockedItemsFresh = 0

  for (const item of items) {
    if (
      blockRulesEngine.isItemBlocked(document.location, item.textContent) ||
      blockRulesEngine.isItemBlocked(
        document.location,
        item.querySelector('span')?.textContent
      )
    ) {
      const element = getClosestItemBlockCandidate(item)
      if (hideElement(element)) {
        ++numBlockedItemsFresh
      }

      ++numBlockedItems
    }
  }

  return { numBlockedItems, numBlockedItemsFresh }
}

function hideElement(element: HTMLElement): boolean {
  if (!element) {
    return false
  }

  const isHidden = element.classList.contains(blockedNodeClassName)
  if (!isHidden) {
    element.classList.add(blockedNodeClassName)
  }

  return !isHidden
}

async function updateHiddenBlockedLinksAndItemsForce() {
  if (settingsStore.settings.isPaused) {
    return
  }

  log.time('update')
  const { numBlockedLinks, numBlockedLinksFresh } = hideBlockedLinks()
  const { numBlockedItems, numBlockedItemsFresh } = hideBlockedItems()

  log.debug('blocked', numBlockedLinks, 'links and', numBlockedItems, 'items')
  log.timeEnd('update')

  tabBlockInfo = {
    numBlockedItems,
    numBlockedLinks
  }

  chrome.runtime.sendMessage({
    type: 'tabBlockInfo',
    ...tabBlockInfo
  })

  if (numBlockedLinksFresh > 0 || numBlockedItemsFresh > 0) {
    await statsStore.updateStats({
      numBlockedItemsTotal:
        statsStore.stats.numBlockedItemsTotal + numBlockedItemsFresh,
      numBlockedLinksTotal:
        statsStore.stats.numBlockedLinksTotal + numBlockedLinksFresh
    })
  }
}

const updateHiddenBlockedLinksAndItems = throttle(
  updateHiddenBlockedLinksAndItemsForce,
  100,
  {
    leading: false
  }
)

async function update() {
  await Promise.all([blockRulesEngine.isReady, settingsStore.isReady])

  if (settingsStore.settings.isPaused) {
    if (mutationObserver) {
      mutationObserver.disconnect()
      mutationObserver = null
    }

    for (const element of select.all(`.${blockedNodeClassName}`)) {
      element.classList.remove(blockedNodeClassName)
    }

    tabBlockInfo = {
      numBlockedItems: 0,
      numBlockedLinks: 0
    }

    chrome.runtime.sendMessage({
      type: 'tabBlockInfo',
      ...tabBlockInfo
    })

    return
  }

  if (!blockRulesEngine.isBlockingEnabledForHost(document.location)) {
    log.info('disabled for host', document.location.hostname)
    return
  }

  if (blockRulesEngine.isUrlBlocked(document.location)) {
    log.info('page blocked', document.location.hostname)
    let blockedRedirectUrl = settingsStore.getSanitizedCustomBlockUrl()

    if (blockedRedirectUrl) {
      log.info('redirecting to custom block url', blockedRedirectUrl)
    } else {
      if (settingsStore.settings.customBlockUrl) {
        log.warn(
          'invalid custom block url',
          settingsStore.settings.customBlockUrl
        )
      }

      const url = new URL(chrome.runtime.getURL('blocked.html'))
      url.searchParams.set('host', document.location.hostname)
      blockedRedirectUrl = url.toString()
    }

    document.location.href = blockedRedirectUrl
    return
  }

  if (!document.body) {
    setTimeout(update, 0)
    return
  }

  const activeBlockEffectClassName =
    settingsStore.settings.blockEffect === 'blur'
      ? blockEffectBlurClassName
      : blockEffectHideClassName
  const inactiveBlockEffectClassName =
    settingsStore.settings.blockEffect === 'hide'
      ? blockEffectBlurClassName
      : blockEffectHideClassName

  document.body.classList.remove(inactiveBlockEffectClassName)
  document.body.classList.add(activeBlockEffectClassName)

  updateHiddenBlockedLinksAndItemsForce()

  // TODO: is it too inefficient to recreate the mutation observer on each
  // database update?
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }

  // TODO: some filtering or targeting of a subtree here would be nice
  // in order to avoid unnecessary effort
  mutationObserver = new MutationObserver(updateHiddenBlockedLinksAndItems)

  mutationObserver.observe(document.body, {
    subtree: true,
    childList: true
  })
}

function updateSelectedElementImpl(event: Event) {
  if (!event.target || selectedLink === event.target) {
    return
  }

  const target = event.target as HTMLElement
  if (selectedElement?.contains(target)) {
    // log.debug('no need to get candidate', target)
    return
  }

  const candidate = getBestLinkBlockCandidate(target)
  if (!candidate) {
    // log.debug('empty candidate', target)
    clearSelectedElement()
    return
  }

  const { link, element } = candidate
  if (selectedLink === link || selectedLinkOldHref === link.href) {
    // log.debug('duplicate candidate')
    return
  }

  clearSelectedElement()
  // log.debug('new element selected', link.href)

  selectedLink = link
  selectedElement = element
  selectedElement.classList.add(selectedNodeClassName)

  // forcefully override click behavior for selected elements
  selectedLinkOldHref = selectedLink.href
  selectedLinkOldOnClick = selectedLink.onclick
  selectedElementOldOnClick = selectedElement.onclick
  // selectedLink.href = 'javascript:void(0)'
  selectedLink.onclick = interceptClick
  selectedElement.onclick = interceptClick
}

function clearSelectedElement() {
  // reset old behavior for selected elements
  if (selectedElement) {
    selectedElement.classList.remove(selectedNodeClassName)
    selectedElement.onclick = selectedElementOldOnClick
  }

  if (selectedLink) {
    // selectedLink.href = selectedLinkOldHref!
    selectedLink.onclick = selectedLinkOldOnClick
  }

  selectedLinkOldHref = null
  selectedLinkOldOnClick = null
  selectedElementOldOnClick = null
  selectedElement = null
  selectedLink = null
}

async function blockElement(event: Event) {
  if (!selectedElement || !selectedLink) {
    // dismiss the selection behavior upon clicking an empty area
    updateIsAddingLinkBlock(false)
    return
  }

  event.preventDefault()
  event.stopPropagation()

  const url = selectedLinkOldHref!

  updateIsAddingLinkBlock(false)
  clearSelectedElement()

  const addBlockLinkP = blockRulesEngine.addBlockLinkRule({
    hostname: document.location.hostname,
    url
  })

  chrome.runtime.sendMessage({
    type: 'event:stopIsAddingLinkBlock'
  })

  await addBlockLinkP

  if (createToast) {
    createToast.success('New link blocked')
  }

  return false
}

// used to forcefully override click behavior for selected elements
function interceptClick(event: Event) {
  event.preventDefault()
  event.stopPropagation()

  blockElement(event)
  return false
}

const updateSelectedElement = debounce(updateSelectedElementImpl, 5)

function updateIsAddingLinkBlock(isAddingLinkBlockUpdate: boolean) {
  if (isAddingLinkBlock === isAddingLinkBlockUpdate) {
    return
  }

  isAddingLinkBlock = isAddingLinkBlockUpdate
  const action = isAddingLinkBlock ? 'addEventListener' : 'removeEventListener'
  document[action]('mouseover', updateSelectedElement)
  // using mousedown instead of click seems to successfully preempt some page
  // onclick actions such as displaying popups / offers / ads
  document[action]('click', blockElement)
  clearSelectedElement()

  if (createToast) {
    if (isAddingLinkBlockToastId) {
      createToast.dismiss(isAddingLinkBlockToastId)
      isAddingLinkBlockToastId = null
    }

    if (isAddingLinkBlock) {
      isAddingLinkBlockToastId = createToast.loading(
        'Select the link you want to block'
      )
    }
  }
}

async function initReact() {
  try {
    // All react-related features used by the content script are imported dynamically
    // via a separate entry bundle. This keeps the core content bundle small and
    // allows us to only load the react features once the initial DOM has been loaded.
    // This is also important because some of the react libraries we're using assume
    // that important DOM nodes like `document.head` and `document.body` always exist.
    await import(/*webpackIgnore: true*/ chrome.runtime.getURL('toast.js'))
  } catch (err) {
    console.info('toast load error', err)
    return
  }

  // hacky way to share globals from separate toast bundle
  createToast = (window as any).toast
}

function init() {
  if (!document.head || !document.body) {
    window.addEventListener('DOMContentLoaded', init)
    return
  }

  update()
  initReact()

  document.body.addEventListener('keydown', (e) => {
    if (e.key == 'Escape') {
      updateIsAddingLinkBlock(false)
    }
  })
}

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.type) {
    case 'update':
      update()
      sendResponse()
      break
    case 'query:tabBlockInfo':
      sendResponse(tabBlockInfo)
      break
    case 'query:contentScriptID':
      sendResponse(contentScriptID)
      break
    case 'event:updateIsAddingLinkBlock':
      updateIsAddingLinkBlock(!!message.isAddingLinkBlock)
      sendResponse()
      break
  }
})

init()
update()
window.addEventListener('load', update)
blockRulesEngine.on('update', update)
settingsStore.on('update', update)
