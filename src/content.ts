import throttle from 'lodash.throttle'
import select from 'select-dom'
import {
  isBlockingEnabledForHost,
  isUrlBlocked,
  isUrlBlockedAsString,
  isItemBlocked
} from './utils'

let observer: MutationObserver | null = null
let numUpdates = 0
let tabBlockInfo = {
  numBlockedLinks: 0,
  numBlockedItems: 0
}

function hideBlockedLinks() {
  const links = select.all('a')

  let numBlockedLinks = 0
  let numBlockedLinksFresh = 0

  for (const link of links) {
    if (isUrlBlockedAsString(link.href)) {
      const element = link.closest('li') || link.closest('div') || link
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
      if (hideElement(item)) {
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

update()
window.addEventListener('load', update)

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.type) {
    case 'update':
      update()
      sendResponse()
      break
    case 'tabBlockInfoQuery':
      sendResponse(tabBlockInfo)
      break
  }
})
