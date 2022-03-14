import throttle from 'lodash.throttle'
import select from 'select-dom'
import {
  isBlockingEnabledForHost,
  isUrlBlocked,
  isUrlBlockedAsString,
  isItemBlocked
} from './utils'

let observer: MutationObserver | null = null

function hideBlockedLinks() {
  const links = select.all('a')

  let numBlocked = 0
  for (const link of links) {
    if (isUrlBlockedAsString(link.href)) {
      const parent = link.closest('li') || link.closest('div') || link
      hideElement(parent)
      ++numBlocked
    }
  }

  console.log('internet diet blocked', numBlocked, 'links')
}

function hideBlockedItems() {
  const items = select.all('li')

  let numBlocked = 0
  for (const item of items) {
    if (
      isItemBlocked(document.location, item.textContent) ||
      isItemBlocked(document.location, item.querySelector('span')?.textContent)
    ) {
      hideElement(item)
      ++numBlocked
    }
  }

  console.log('internet diet blocked', numBlocked, 'items')
}

function hideElement(
  element: HTMLElement,
  { remove = false }: { remove?: boolean } = {}
) {
  if (!element) {
    return
  }

  // let isReplaced = false

  // if (replace) {
  //   const picture = element.querySelectorAll('picture')[0]
  //   const replacementImage = document.createElement('img')
  //   replacementImage.style.objectFit = 'cover'
  //   replacementImage.style.maxWidth = '100%'
  //   replacementImage.src = chrome.runtime.getURL('assets/healthy-bg.jpg')

  //   if (picture) {
  //     picture.replaceWith(replacementImage)
  //     isReplaced = true
  //   } else {
  //     const img = element.querySelectorAll('img')[0]
  //     if (img) {
  //       img.replaceWith(replacementImage)
  //       isReplaced = true
  //     }
  //   }
  // }

  if (remove) {
    element.style.display = 'none'
    // element.style.backgroundColor = 'red'
  } else {
    element.style.pointerEvents = 'none'
    element.style.filter = 'blur(16px)'
    element.style.userSelect = 'none'
  }
}

function updateHiddenBlockedLinksAndItemsForce() {
  console.log('>>> internet diet updating')
  console.time('internet diet update')
  hideBlockedLinks()
  hideBlockedItems()
  console.timeEnd('internet diet update')
  console.log('<<< internet diet updating')
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

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.message === 'update') {
    update()
  }

  sendResponse({ received: true })
})
