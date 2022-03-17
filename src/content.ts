import select from 'select-dom'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'
import type toast from 'react-hot-toast'
import { BlockRulesEngine, normalizeUrl } from './block-rules-engine'
import * as log from './log'

const selectedNodeClassName = 'internet-diet-selected'
const stylesNodeId = 'internet-diet-styles-0'

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

function hideElement(
  element: HTMLElement,
  { remove = false }: { remove?: boolean } = {}
): boolean {
  if (!element) {
    return false
  }

  if (remove) {
    const isHidden = element.style.display === 'none'
    element.style.display = 'none'
    // element.style.backgroundColor = 'red'

    return !isHidden
  } else {
    const isHidden =
      element.style.pointerEvents === 'none' &&
      element.style.filter === 'blur(16px)' &&
      element.style.userSelect === 'none'

    element.style.pointerEvents = 'none'
    element.style.filter = 'blur(16px)'
    element.style.userSelect = 'none'

    return !isHidden
  }
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
  if (!blockRulesEngine.isBlockingEnabledForHost(document.location)) {
    log.info('update blocking disabled for host', document.location.hostname)
    return
  } else if (blockRulesEngine.isUrlBlocked(document.location)) {
    log.info('update page is blocked', document.location.hostname)
    const url = new URL(chrome.runtime.getURL('blocked.html'))
    url.searchParams.set('host', document.location.hostname)
    document.location.href = url.toString()
  } else {
    log.info('update page is not blocked', document.location.hostname)
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

function addStyles(css: string) {
  clearStyles()
  const style = document.createElement('style')
  style.id = stylesNodeId
  style.textContent = css
  document.head?.appendChild(style)
}

function clearStyles() {
  const stylesNode = document.getElementById(stylesNodeId)
  stylesNode?.parentNode?.removeChild(stylesNode)
}

function initStyles() {
  if (!document.head) {
    window.addEventListener('DOMContentLoaded', initStyles)
    return
  }

  // note: using "pointer-events: none" for the active class messes up the mouseover and
  // mouseout events, so we're not using them here
  const css = `
.${selectedNodeClassName} {
  background: repeating-linear-gradient(135deg, rgba(225, 225, 226, 0.3), rgba(229, 229, 229, 0.3) 10px, rgba(173, 173, 173, 0.3) 10px, rgba(172, 172, 172, 0.3) 20px);
  box-shadow: inset 0px 0px 0px 1px #d7d7d7;
  cursor: pointer;
}

.${selectedNodeClassName} img {
  filter: blur(16px);
}
`

  addStyles(css)
}

async function initReact() {
  if (!document.body) {
    window.addEventListener('DOMContentLoaded', initReact)
    return
  }

  try {
    // All react-related features used by the content script are imported dynamically
    // via a separate entry bundle. This keeps the core content bundle small and
    // allows us to only load the react features once the initial DOM has been
    // loaded. This is important because many react libraries assume that important
    // DOM nodes like `document.head` and `document.body` exist.
    await import(/*webpackIgnore: true*/ chrome.runtime.getURL('toast.js'))
  } catch (err) {
    console.info('toast load error', err)
    return
  }

  // hacky way to share globals from separate toast bundle
  createToast = (window as any).toast
}

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.type) {
    case 'update':
      update()
      sendResponse()
      break
    case 'tabBlockInfoQuery':
      sendResponse(tabBlockInfo)
      break
    case 'event:updateIsAddingLinkBlock':
      updateIsAddingLinkBlock(!!message.isAddingLinkBlock)
      break
  }
})

update()
initStyles()
initReact()
window.addEventListener('load', update)
blockRulesEngine.on('update', update)
