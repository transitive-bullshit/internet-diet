import React from 'react'
import { FaCog } from '@react-icons/all-files/fa/FaCog'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'
import { FaUnlink } from '@react-icons/all-files/fa/FaUnlink'
import { FaBan } from '@react-icons/all-files/fa/FaBan'

import { cs } from '../utils'
import styles from './Popup.module.css'

interface TabInfo {
  id: number
  title: string
  hostname: string
  url: string
}

const noop = () => {}

export const Popup = () => {
  const [isAddingLinkBlock, setIsAddingLinkBlock] = React.useState(false)
  const [tabInfo, setTabInfo] = React.useState<TabInfo | null>(null)
  const [numBlockedItems, setNumBlockedItems] = React.useState(0)
  const [numBlockedLinks, setNumBlockedLinks] = React.useState(0)
  const [numBlockedItemsTotal, setNumBlockedItemsTotal] = React.useState(0)
  const [numBlockedLinksTotal, setNumBlockedLinksTotal] = React.useState(0)

  const onClickOpenSupportPage = React.useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/transitive-bullshit/internet-diet'
    })
  }, [])

  const onClickOpenOptionsPage = React.useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const onClickToggleAddLinkBlock = React.useCallback(() => {
    setIsAddingLinkBlock(!isAddingLinkBlock)
  }, [isAddingLinkBlock])

  const onClickBlockCurrentPage = React.useCallback(() => {
    if (!tabInfo || !tabInfo.hostname || !tabInfo.url) {
      return
    }

    chrome.runtime.sendMessage({
      type: 'event:addBlockLinkRule',
      hostname: tabInfo.hostname,
      url: tabInfo.url
    })
  }, [tabInfo])

  const onClickBlockCurrentHost = React.useCallback(() => {
    if (!tabInfo || !tabInfo.hostname) {
      return
    }

    chrome.runtime.sendMessage({
      type: 'event:addBlockHostRule',
      hostname: tabInfo.hostname
    })
  }, [tabInfo])

  React.useEffect(() => {
    // fetch the number of blocked items for the current tab
    chrome.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
      const activeTab = tabs[0]

      if (activeTab) {
        let hostname = activeTab.title || 'active tab'
        try {
          const url = new URL(activeTab.url!)
          if (url.hostname) {
            hostname = url.hostname
          }
        } catch (err) {}

        setTabInfo({
          title: activeTab.title!,
          id: activeTab.id!,
          url: activeTab.url!,
          hostname
        })
      }
    })

    // TODO: is it necessary to handle active tab onChanged event?
  }, [])

  React.useEffect(() => {
    if (!tabInfo) {
      setNumBlockedItems(0)
      setNumBlockedLinks(0)
      return
    }

    chrome.tabs.sendMessage(
      tabInfo.id,
      {
        type: 'tabBlockInfoQuery'
      },
      (response) => {
        setNumBlockedItems(response.numBlockedItems)
        setNumBlockedLinks(response.numBlockedLinks)
      }
    )
  }, [tabInfo])

  React.useEffect(() => {
    chrome.runtime.onMessage.addListener(
      async (message, sender, sendResponse) => {
        const tabId = sender?.tab?.id
        if (!tabId || !sender?.tab?.active) {
          sendResponse()
          return
        }

        // TODO: verify tabInfo.id matches sender.tab.id?

        switch (message.type) {
          case 'tabBlockInfo':
            setNumBlockedItems(message.numBlockedItems)
            setNumBlockedLinks(message.numBlockedLinks)
            break
          case 'event:stopIsAddingLinkBlock':
            setIsAddingLinkBlock(false)
            break
        }

        sendResponse()
        return true
      }
    )
  }, [])

  // ensure the stats stay up-to-date
  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!tabInfo) {
      return
    }

    chrome.tabs.sendMessage(
      tabInfo.id,
      {
        type: 'event:updateIsAddingLinkBlock',
        isAddingLinkBlock
      },
      () => {
        if (isAddingLinkBlock) {
          // Close the popup window which transfers focus over to the active tab.
          // NOTE: this is the only way that I found which allows the user to click
          // a single time in order to make their selection on the page.
          window.close()
        }
      }
    )
  }, [tabInfo, isAddingLinkBlock])

  const isTabPrivate = tabInfo?.url?.startsWith('chrome')
  const isBlockPageEnabled =
    tabInfo && tabInfo.hostname && tabInfo.url && !isTabPrivate
  const isBlockHostEnabled = tabInfo && tabInfo.hostname && !isTabPrivate

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
          <button
            aria-label='Support'
            className={styles.button}
            onClick={onClickOpenSupportPage}
          >
            <FaQuestion />
          </button>

          <button
            aria-label='Open settings'
            className={styles.button}
            onClick={onClickOpenOptionsPage}
          >
            <FaCog />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {!isTabPrivate && (
          <>
            <div className={styles.hostname}>
              {tabInfo?.hostname || 'active tab'}
            </div>

            <div className={styles.spacer} />
          </>
        )}

        <div className={styles.row}>
          <div>Blocked links:</div>

          <div className={styles.subRow}>
            <div>
              <span className={styles.stat}>
                {numBlockedLinks.toLocaleString('en-US')}
              </span>{' '}
              on this page
            </div>

            <div>
              <span className={styles.stat}>
                {numBlockedLinksTotal.toLocaleString('en-US')}
              </span>{' '}
              in total
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <div>Blocked items:</div>

          <div className={styles.subRow}>
            <div>
              <span className={styles.stat}>
                {numBlockedItems.toLocaleString('en-US')}
              </span>{' '}
              on this page
            </div>

            <div>
              <span className={styles.stat}>
                {numBlockedItemsTotal.toLocaleString('en-US')}
              </span>{' '}
              in total
            </div>
          </div>
        </div>

        <div className={styles.spacer} />

        <div className={styles.row}>
          <button
            aria-label='Add link to block'
            className={cs(
              styles.toggle,
              isAddingLinkBlock && styles.active,
              !isBlockPageEnabled && styles.disabled
            )}
            onClick={isBlockPageEnabled ? onClickToggleAddLinkBlock : noop}
            disabled={!isBlockPageEnabled}
          >
            {isAddingLinkBlock && isBlockPageEnabled ? (
              <>
                Select link on page to block <FaUnlink />
              </>
            ) : (
              <>
                Block a link on this page <FaUnlink />
              </>
            )}
          </button>
        </div>

        <div className={styles.row}>
          <button
            aria-label='Block this page'
            className={cs(
              styles.toggle,
              !isBlockPageEnabled && styles.disabled
            )}
            onClick={isBlockPageEnabled ? onClickBlockCurrentPage : noop}
            disabled={!isBlockPageEnabled}
          >
            Block this page <FaUnlink />
          </button>
        </div>

        <div className={styles.row}>
          <button
            aria-label='Block this page'
            className={cs(
              styles.toggle,
              !isBlockHostEnabled && styles.disabled
            )}
            onClick={isBlockHostEnabled ? onClickBlockCurrentHost : noop}
            disabled={!isBlockHostEnabled}
          >
            {isBlockHostEnabled ? (
              <>
                Block all of {tabInfo?.hostname} <FaBan />
              </>
            ) : (
              <>
                Block this site <FaBan />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
