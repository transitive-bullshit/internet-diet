import React from 'react'

import styles from './Popup.module.css'

export const Popup = () => {
  const [tabTitle, setTabTitle] = React.useState('')
  const [numBlockedItems, setNumBlockedItems] = React.useState(0)
  const [numBlockedLinks, setNumBlockedLinks] = React.useState(0)
  const [numBlockedItemsTotal, setNumBlockedItemsTotal] = React.useState(0)
  const [numBlockedLinksTotal, setNumBlockedLinksTotal] = React.useState(0)

  React.useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
      const activeTab = tabs[0]

      if (activeTab) {
        let title = activeTab.title || ''
        try {
          const url = new URL(activeTab.url!)
          if (url.hostname) {
            title = url.hostname
          }
        } catch (err) {}

        setTabTitle(title)

        chrome.tabs.sendMessage(
          activeTab.id!,
          {
            type: 'tabBlockInfoQuery'
          },
          (response) => {
            setNumBlockedItems(response.numBlockedItems)
            setNumBlockedLinks(response.numBlockedLinks)
          }
        )
      }
    })

    chrome.runtime.onMessage.addListener(
      async (message, sender, sendResponse) => {
        switch (message.type) {
          case 'tabBlockInfo':
            const tabId = sender?.tab?.id
            if (!tabId || !sender?.tab?.active) {
              break
            }
            setNumBlockedItems(message.numBlockedItems)
            setNumBlockedLinks(message.numBlockedLinks)
            break
        }

        sendResponse()
        return true
      }
    )

    // fetch total blocked numbers from storage
    ;(async function () {
      const { numBlockedLinksTotal = 0, numBlockedItemsTotal = 0 } =
        await chrome.storage.sync.get([
          'numBlockedLinksTotal',
          'numBlockedItemsTotal'
        ])

      setNumBlockedItemsTotal(numBlockedItemsTotal)
      setNumBlockedLinksTotal(numBlockedLinksTotal)

      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return

        if (changes.numBlockedLinksTotal) {
          setNumBlockedLinksTotal(changes.numBlockedLinksTotal.newValue)
        }

        if (changes.numBlockedItemsTotal) {
          setNumBlockedItemsTotal(changes.numBlockedItemsTotal.newValue)
        }
      })
    })()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a
          className={styles.logo}
          href='https://github.com/transitive-bullshit/internet-diet'
          target='_blank'
          rel='noopener noreferrer'
        >
          <img src='/assets/icon@128.png' />
          <span>Internet Diet</span>
        </a>
      </div>

      <div className={styles.body}>
        <div className={styles.hostname}>{tabTitle}</div>

        <div className={styles.spacer} />

        <div className={styles.row}>
          <div>Blocked links</div>
          <div>{numBlockedLinks} on this page</div>
          <div>{numBlockedLinksTotal} total</div>
        </div>

        <div className={styles.row}>
          <div>Blocked items</div>
          <div>{numBlockedItems} on this page</div>
          <div>{numBlockedItemsTotal} total</div>
        </div>
      </div>
    </div>
  )
}
