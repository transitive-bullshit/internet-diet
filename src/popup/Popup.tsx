import React from 'react'
// import { FaCog } from 'react-icons/fa'
import { FaCog } from '@react-icons/all-files/fa/FaCog'

import styles from './Popup.module.css'

export const Popup = () => {
  const [tabTitle, setTabTitle] = React.useState('')
  const [numBlockedItems, setNumBlockedItems] = React.useState(0)
  const [numBlockedLinks, setNumBlockedLinks] = React.useState(0)
  const [numBlockedItemsTotal, setNumBlockedItemsTotal] = React.useState(0)
  const [numBlockedLinksTotal, setNumBlockedLinksTotal] = React.useState(0)

  React.useEffect(() => {
    // fetch the number of blocked items for the current tab
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

    // ensure the stats stay up-to-date as the current tab changes
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
    ;(async function () {
      // fetch the total blocked stats from storage
      const { numBlockedLinksTotal = 0, numBlockedItemsTotal = 0 } =
        await chrome.storage.sync.get([
          'numBlockedLinksTotal',
          'numBlockedItemsTotal'
        ])

      setNumBlockedItemsTotal(numBlockedItemsTotal)
      setNumBlockedLinksTotal(numBlockedLinksTotal)

      // ensure the total stats stay up-to-date with storage
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

        <div className={styles.options}>
          <button aria-label='Open settings' className={styles.button}>
            <FaCog />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.hostname}>{tabTitle}</div>

        <div className={styles.spacer} />

        <div className={styles.row}>
          <div>Blocked links:</div>
          <div className={styles.subRow}>
            <div>
              <span className={styles.stat}>{numBlockedLinks}</span> on this
              page
            </div>
            <div>
              <span className={styles.stat}>{numBlockedLinksTotal}</span> in
              total
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div>Blocked items:</div>
          <div className={styles.subRow}>
            <div>
              <span className={styles.stat}>{numBlockedItems}</span> on this
              page
            </div>
            <div>
              <span className={styles.stat}>{numBlockedItemsTotal}</span> in
              total
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
