import {
  isBlockingEnabledForHost,
  isUrlBlocked,
  isUrlBlockedAsString
} from './utils'

function hideBlockedLinks() {
  const links = [...document.querySelectorAll('a')]

  let blocked = 0
  for (const link of links) {
    if (isUrlBlockedAsString(link.href)) {
      const parent = link.closest('li') || link.closest('div') || link
      parent.style.display = 'none'
      ++blocked
      // parent.style.backgroundColor = 'red'
    }
  }

  console.log('internet diet blocked', blocked, 'links')
}

function update() {
  if (!isBlockingEnabledForHost(document.location)) {
    return
  }

  if (isUrlBlocked(document.location)) {
    document.location.href = chrome.runtime.getURL('blocked.html')
  }

  hideBlockedLinks()
}

update()
window.addEventListener('load', update)

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.message === 'update') {
    update()
  }

  sendResponse({ received: true })
})
