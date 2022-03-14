const blacklist = [
  'mcdonalds',
  '7-eleven',
  'burger-king',
  '99-cent-supreme-pizza',
  'marthas-breakfast-sandwiches-1117-broadway',
  'LPAvJw9xUn-qcF9uAhfUcA'
]

function hideStores() {
  const stores = [...document.querySelectorAll('a')].filter(
    (a) => a.href.indexOf('/store/') >= 0
  )

  for (const store of stores) {
    for (const item of blacklist) {
      if (store.href.includes(item)) {
        const parent = store.closest('li') || store.closest('div') || store
        parent.style.display = 'none'
        break
      }
    }
  }
}

function update() {
  if (document.location.hostname !== 'postmates.com') {
    return
  }

  hideStores()
}

update()
window.addEventListener('load', update)

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === 'update') {
    update()
  }
})
