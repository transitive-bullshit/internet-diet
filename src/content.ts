import {
  isBlockingEnabledForHost,
  isUrlBlocked,
  isUrlBlockedAsString
} from './utils'

function hideStores() {
  const stores = [...document.querySelectorAll('a')].filter(
    (a) => a.href.indexOf('/store/') >= 0
  )

  for (const store of stores) {
    if (isUrlBlockedAsString(store.href)) {
      const parent = store.closest('li') || store.closest('div') || store
      parent.style.display = 'none'
      // parent.style.backgroundColor = 'red'
    }
  }
}

function update() {
  if (!isBlockingEnabledForHost(document.location)) {
    return
  }

  if (isUrlBlocked(document.location)) {
    document.location.href = chrome.runtime.getURL('blocked.html')
  }

  hideStores()
}

update()
window.addEventListener('load', update)

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.message === 'update') {
    update()
  }

  sendResponse({ received: true })
})
