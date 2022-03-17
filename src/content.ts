import select from 'select-dom'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'
import type toast from 'react-hot-toast'
import { BlockRulesEngine, normalizeUrl } from './block-rules-engine'
import {
  contentScriptID,
  blockedNodeClassName,
  selectedNodeClassName
} from 'definitions'
import * as log from './log'

/*
  Make injecting this content script idempotent in case multiple copies are injected.

  When the extension's action is triggered, the popup JS will attempt to send a
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
  statically injecting it into every tab.
*/
if ((window as any)[contentScriptID]) {
  log.info('content script duplicate', contentScriptID)
  throw new Error(`duplicate ${contentScriptID}`)
} else {
  log.info('content script', contentScriptID)
  ;(window as any)[contentScriptID] = true
}

const blockRulesEngine = new BlockRulesEngine()
let observer: MutationObserver | null = null
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
      const element = getClosestLinkBlockCandidate(link)
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

  // TODO: this should be an option available from the options page
  // TODO: change to use the class approach so it's reversible
  // const isHidden = element.style.display === 'none'
  // element.style.display = 'none'
  // element.style.backgroundColor = 'red'

  const isHidden = element.classList.contains(blockedNodeClassName)
  if (!isHidden) {
    element.classList.add(blockedNodeClassName)
  }

  return !isHidden
}

function getClosestLinkBlockCandidate(element: HTMLElement) {
  return element.closest('li') || element.closest('div') || element
}

function getClosestItemBlockCandidate(element: HTMLElement) {
  return element.closest('li') || element.closest('div') || element
}

async function updateHiddenBlockedLinksAndItemsForce() {
  log.debug('----------------')

  const { numBlockedLinks, numBlockedLinksFresh } = hideBlockedLinks()
  const { numBlockedItems, numBlockedItemsFresh } = hideBlockedItems()

  log.debug('blocked', numBlockedLinks, 'links')
  log.debug('blocked', numBlockedItems, 'items')

  tabBlockInfo = {
    numBlockedItems,
    numBlockedLinks
  }

  chrome.runtime.sendMessage({
    type: 'tabBlockInfo',
    ...tabBlockInfo
  })

  log.debug('----------------')

  if (numBlockedLinksFresh > 0) {
    const { numBlockedLinksTotal = 0 } = await chrome.storage.sync.get([
      'numBlockedLinksTotal'
    ])
    await chrome.storage.sync.set({
      numBlockedLinksTotal: numBlockedLinksTotal + numBlockedLinksFresh
    })
  }

  if (numBlockedItemsFresh > 0) {
    const { numBlockedItemsTotal = 0 } = await chrome.storage.sync.get([
      'numBlockedItemsTotal'
    ])

    await chrome.storage.sync.set({
      numBlockedItemsTotal: numBlockedItemsTotal + numBlockedItemsFresh
    })
  }
}

const updateHiddenBlockedLinksAndItems = throttle(
  updateHiddenBlockedLinksAndItemsForce,
  10,
  {
    leading: false
  }
)

function update() {
  if (blockRulesEngine.isPaused) {
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
    const url = new URL(chrome.runtime.getURL('blocked.html'))
    url.searchParams.set('host', document.location.hostname)
    document.location.href = url.toString()
    return
  }

  if (!document.body) {
    setTimeout(update, 0)
    return
  }

  updateHiddenBlockedLinksAndItemsForce()

  if (observer) {
    observer.disconnect()
    observer = null
  }

  observer = new MutationObserver(function () {
    // TODO: some filtering or targeting of a subtree here would be nice
    // in order to avoid unnecessary effort
    updateHiddenBlockedLinksAndItems()
  })

  observer.observe(document.body, {
    subtree: true,
    childList: true
  })
}

function selectElementImpl(event: Event) {
  if (!event.target || selectedLink === event.target) {
    return
  }

  const target = event.target as HTMLElement
  const link = target.closest('a')

  if (selectedLink === link) {
    return
  }

  clearElementImpl()

  if (!link || !normalizeUrl(link.href)) {
    return
  }

  const element = getClosestLinkBlockCandidate(link)
  if (!element) {
    return
  }

  selectedLink = link
  selectedElement = element
  selectedElement.classList.add(selectedNodeClassName)

  // forcefully override click behavior for selected elements
  selectedLinkOldHref = selectedLink.href
  selectedLinkOldOnClick = selectedLink.onclick
  selectedElementOldOnClick = selectedElement.onclick
  selectedLink.href = 'javascript:void(0)'
  selectedLink.onclick = interceptClick
  selectedElement.onclick = interceptClick
}

function clearElementImpl() {
  if (!selectedElement || !selectedLink) {
    return
  }

  // reset old behavior for selected elements
  selectedElement.classList.remove(selectedNodeClassName)
  selectedLink.href = selectedLinkOldHref!
  selectedLink.onclick = selectedLinkOldOnClick
  selectedElement.onclick = selectedElementOldOnClick
  selectedLinkOldHref = null
  selectedLinkOldOnClick = null
  selectedElementOldOnClick = null
  selectedElement = null
  selectedLink = null
}

async function blockElement(event: Event) {
  if (!selectedElement || !selectedLink) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  const url = selectedLinkOldHref!
  clearElementImpl()

  const addBlockLinkRuleP = blockRulesEngine.addBlockLinkRule({
    hostname: document.location.hostname,
    url
  })

  updateIsAddingLinkBlock(false)
  chrome.runtime.sendMessage({
    type: 'event:stopIsAddingLinkBlock'
  })

  if (createToast) {
    await createToast.promise(addBlockLinkRuleP, {
      loading: 'Blocking new link',
      success: 'New link blocked',
      error: 'Error blocking link'
    })
  }

  await addBlockLinkRuleP
  return false
}

// used to forcefully override click behavior for selected elements
function interceptClick(event: Event) {
  event.preventDefault()
  event.stopPropagation()

  blockElement(event)
  return false
}

const selectElement = debounce(selectElementImpl, 1)
const clearElement = debounce(clearElementImpl, 1)

function updateIsAddingLinkBlock(isAddingLinkBlockUpdate: boolean) {
  if (isAddingLinkBlock === isAddingLinkBlockUpdate) {
    return
  }

  isAddingLinkBlock = isAddingLinkBlockUpdate
  const action = isAddingLinkBlock ? 'addEventListener' : 'removeEventListener'
  document[action]('mouseover', selectElement)
  document[action]('mouseout', clearElement)
  document[action]('click', blockElement)
  clearElementImpl()

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
