import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'
import select from 'select-dom'
import {
  isBlockingEnabledForHost,
  isUrlBlocked,
  isUrlBlockedAsString,
  isItemBlocked
} from './utils'

const selectedNodeClassName = 'internet-diet-selected'
const stylesNodeId = 'internet-diet-styles-0'

let observer: MutationObserver | null = null
let selectedElement: HTMLElement | null = null
let selectedLink: HTMLElement | null = null
let numUpdates = 0
let tabBlockInfo = {
  numBlockedLinks: 0,
  numBlockedItems: 0
}
let isAddingLinkBlock = false

function hideBlockedLinks() {
  const links = select.all('a')

  let numBlockedLinks = 0
  let numBlockedLinksFresh = 0

  for (const link of links) {
    if (isUrlBlockedAsString(link.href)) {
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
      isItemBlocked(document.location, item.textContent) ||
      isItemBlocked(document.location, item.querySelector('span')?.textContent)
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
  ++numUpdates

  console.log('>>> internet diet updating')
  console.time(`internet diet update ${numUpdates}`)

  const { numBlockedLinks, numBlockedLinksFresh } = hideBlockedLinks()
  const { numBlockedItems, numBlockedItemsFresh } = hideBlockedItems()

  console.log('internet diet blocked', numBlockedLinks, 'links')
  console.log('internet diet blocked', numBlockedItems, 'items')

  tabBlockInfo = {
    numBlockedItems,
    numBlockedLinks
  }

  chrome.runtime.sendMessage({
    type: 'tabBlockInfo',
    ...tabBlockInfo
  })

  console.timeEnd(`internet diet update ${numUpdates}`)
  console.log('<<< internet diet updating')

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
  if (!isBlockingEnabledForHost(document.location)) {
    return
  } else if (isUrlBlocked(document.location)) {
    document.location.href = chrome.runtime.getURL('blocked.html')
  } else {
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
  if (selectedElement === event.target || !event.target) {
    return
  }

  clearElementImpl()

  const target = event.target as HTMLElement
  selectedLink = target.closest('a')

  if (selectedLink) {
    selectedElement = getClosestLinkBlockCandidate(selectedLink)

    if (selectedElement) {
      selectedElement.classList.add(selectedNodeClassName)
    }
  }
}

function clearElementImpl() {
  if (!selectedElement && !selectedLink) {
    return
  }

  selectedElement?.classList?.remove(selectedNodeClassName)
  selectedElement = null
  selectedLink = null
}

const selectElement = debounce(selectElementImpl, 1)
const clearElement = debounce(clearElementImpl, 1)

function updateIsAddingLinkBlock() {
  const action = isAddingLinkBlock ? 'addEventListener' : 'removeEventListener'
  document[action]('mouseover', selectElement)
  document[action]('mouseout', clearElement)
  clearElementImpl()
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
  const css = `
.${selectedNodeClassName} {
  background: repeating-linear-gradient(135deg, rgba(225, 225, 226, 0.3), rgba(229, 229, 229, 0.3) 10px, rgba(173, 173, 173, 0.3) 10px, rgba(172, 172, 172, 0.3) 20px);
  box-shadow: inset 0px 0px 0px 1px #d7d7d7;
  pointer-events: none;
}

.${selectedNodeClassName} img {
  filter: blur(16px);
}
`

  addStyles(css)
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
    case 'tab:event:toggleIsAddingLinkBlock':
      isAddingLinkBlock = !!message.isAddingLinkBlock
      updateIsAddingLinkBlock()
      break
  }
})

update()
window.addEventListener('load', update)
window.addEventListener('DOMContentLoaded', initStyles)
