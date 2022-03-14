import {
  isBlockingEnabledForHost,
  isUrlBlocked,
  isUrlBlockedAsString,
  isItemBlocked
} from './utils'

function hideBlockedLinks() {
  const links = [...document.querySelectorAll('a')]

  let numBlocked = 0
  for (const link of links) {
    if (isUrlBlockedAsString(link.href)) {
      const parent = link.closest('li') || link.closest('div') || link
      parent.style.display = 'none'
      // parent.style.backgroundColor = 'red'
      ++numBlocked
    }
  }

  console.log('internet diet blocked', numBlocked, 'links')
}

function hideBlockedItems() {
  const items = [...document.querySelectorAll('li')]

  let numBlocked = 0
  for (const item of items) {
    const span = item.querySelector('span')

    if (
      isItemBlocked(document.location, item.textContent) ||
      isItemBlocked(document.location, span?.textContent)
    ) {
      item.style.display = 'none'
      // item.style.backgroundColor = 'red'
      ++numBlocked
    }
  }

  console.log('internet diet blocked', numBlocked, 'items')
}

function update() {
  if (!isBlockingEnabledForHost(document.location)) {
    return
  } else if (isUrlBlocked(document.location)) {
    document.location.href = chrome.runtime.getURL('blocked.html')
  } else {
    hideBlockedLinks()
    hideBlockedItems()
  }
}

update()
window.addEventListener('load', update)

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.message === 'update') {
    update()
  }

  sendResponse({ received: true })
})
