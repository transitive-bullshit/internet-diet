import React from 'react'
import { FaCog } from '@react-icons/all-files/fa/FaCog'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'
import { FaUnlink } from '@react-icons/all-files/fa/FaUnlink'
import { FaBan } from '@react-icons/all-files/fa/FaBan'
import { FaPlay } from '@react-icons/all-files/fa/FaPlay'
import { FaPause } from '@react-icons/all-files/fa/FaPause'

import { ConfirmModal } from 'components/ConfirmModal/ConfirmModal'
import { normalizeUrl } from '../block-rules-engine'
import { SettingsStore } from '../settings-store'
import { StatsStore } from '../stats-store'
import { Stats, Settings } from '../types'
import { cs } from '../utils'
import styles from './Popup.module.css'

interface TabInfo {
  id: number
  title: string
  hostname: string
  url: string
  normalizedUrl: string
}

const noop = () => undefined

export const Popup = () => {
  const [settingsStore, setSettingsStore] = React.useState<SettingsStore>()
  const [settings, setSettings] = React.useState<Partial<Settings>>()

  const [statsStore, setStatsStore] = React.useState<StatsStore>()
  const [stats, setStats] = React.useState<Partial<Stats>>()

  const [isBlockSiteConfirmModalOpen, setIsConfirmBlockSiteModalOpen] =
    React.useState(false)
  const [isBlockPageConfirmModalOpen, setIsConfirmBlockPageModalOpen] =
    React.useState(false)
  const [isAddingLinkBlock, setIsAddingLinkBlock] = React.useState(false)
  const [tabInfo, setTabInfo] = React.useState<TabInfo | null>(null)
  const [numBlockedItems, setNumBlockedItems] = React.useState<
    number | undefined
  >(undefined)
  const [numBlockedLinks, setNumBlockedLinks] = React.useState<
    number | undefined
  >(undefined)

  const onClickOpenSupportPage = React.useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/transitive-bullshit/internet-diet'
    })
  }, [])

  const onClickOpenOptionsPage = React.useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const onClickOpenBlockSiteConfirmModal = React.useCallback(() => {
    setIsConfirmBlockSiteModalOpen(true)
  }, [])

  const onClickCloseBlockSiteConfirmModal = React.useCallback(() => {
    setIsConfirmBlockSiteModalOpen(false)
  }, [])

  const onClickOpenBlockPageConfirmModal = React.useCallback(() => {
    setIsConfirmBlockPageModalOpen(true)
  }, [])

  const onClickCloseBlockPageConfirmModal = React.useCallback(() => {
    setIsConfirmBlockPageModalOpen(false)
  }, [])

  const onClickToggleAddLinkBlock = React.useCallback(() => {
    setIsAddingLinkBlock(!isAddingLinkBlock)
  }, [isAddingLinkBlock])

  const onClickToggleIsPaused = React.useCallback(() => {
    setSettings({
      ...settings,
      isPaused: !settings?.isPaused
    })
  }, [settings])

  const onClickBlockCurrentPage = React.useCallback(() => {
    if (!tabInfo || !tabInfo.hostname || !tabInfo.url) {
      return
    }

    chrome.runtime.sendMessage({
      type: 'event:addBlockLinkRule',
      hostname: tabInfo.hostname,
      url: tabInfo.url
    })

    onClickCloseBlockPageConfirmModal()
  }, [tabInfo, onClickCloseBlockPageConfirmModal])

  const onClickBlockCurrentHost = React.useCallback(() => {
    if (!tabInfo || !tabInfo.hostname) {
      return
    }

    chrome.runtime.sendMessage({
      type: 'event:addBlockHostRule',
      hostname: tabInfo.hostname
    })

    onClickCloseBlockSiteConfirmModal()
  }, [tabInfo, onClickCloseBlockSiteConfirmModal])

  function updateTabInfo(tab?: chrome.tabs.Tab) {
    if (!tab) {
      return
    }

    const normalizedUrl = normalizeUrl(tab.url)
    let hostname = tab.title || 'active tab'
    try {
      const url = new URL(tab.url!)
      if (url.hostname) {
        hostname = url.hostname
      }
    } catch (err) {
      // fallback gracefully
    }

    setTabInfo({
      id: tab.id!,
      title: tab.title!,
      hostname,
      url: tab.url!,
      normalizedUrl
    })
  }

  React.useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
      const activeTab = tabs[0]
      updateTabInfo(activeTab)
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && tab.active) {
        updateTabInfo(tab)
      }
    })
  }, [])

  // fetch the number of blocked items for the current tab
  React.useEffect(() => {
    if (!tabInfo) {
      setNumBlockedItems(0)
      setNumBlockedLinks(0)
      return
    }

    chrome.tabs.sendMessage(
      tabInfo.id,
      {
        type: 'query:tabBlockInfo'
      },
      (response) => {
        if (!response) {
          // there was likely a problem injecting the content script
          return
        }

        setNumBlockedItems(response.numBlockedItems)
        setNumBlockedLinks(response.numBlockedLinks)
      }
    )
  }, [tabInfo])

  // sync variables from current tab
  React.useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const tabId = sender?.tab?.id

      // TODO: should we also verify tabInfo.id matches sender.tab.id?
      if (!tabId || !sender?.tab?.active) {
        sendResponse()
        return
      }

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
    })
  }, [])

  // initialize the settings store
  React.useEffect(() => {
    ;(async () => {
      const store = new SettingsStore()
      try {
        await store.isReady
      } catch (err) {
        console.error('error initializing settings store', err)
        return
      }

      setSettingsStore(store)
      setSettings(store.settings)
    })()
  }, [])

  // initialize the stats store
  React.useEffect(() => {
    ;(async () => {
      const store = new StatsStore()
      try {
        await store.isReady
      } catch (err) {
        console.error('error initializing stats store', err)
        return
      }

      setStatsStore(store)
      setStats(store.stats)
    })()
  }, [])

  // sync settings store changes to local
  React.useEffect(() => {
    settingsStore?.on('update', () => {
      setSettings(settingsStore.settings)
    })
  }, [settingsStore])

  // sync stats store changes to local
  React.useEffect(() => {
    statsStore?.on('update', () => {
      setStats(statsStore.stats)
    })
  }, [statsStore])

  // sync local settings changes to store
  React.useEffect(() => {
    ;(async () => {
      if (!settings || !settingsStore) {
        return
      }

      await settingsStore.updateSettings(settings)
    })()
  }, [settings, settingsStore])

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
    tabInfo &&
    tabInfo.hostname &&
    tabInfo.normalizedUrl &&
    !isTabPrivate &&
    !settings?.isPaused
  const isBlockHostEnabled =
    tabInfo && tabInfo.hostname && !isTabPrivate && !settings?.isPaused

  return (
    <>
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
                {numBlockedLinks !== undefined && (
                  <>
                    <span className={styles.stat}>
                      {numBlockedLinks.toLocaleString('en-US')}
                    </span>{' '}
                    on this page
                  </>
                )}
              </div>

              <div>
                {stats?.numBlockedLinksTotal !== undefined && (
                  <>
                    <span className={styles.stat}>
                      {stats?.numBlockedLinksTotal?.toLocaleString('en-US')}
                    </span>{' '}
                    in total
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div>Blocked menu items:</div>

            <div className={styles.subRow}>
              <div>
                {numBlockedItems !== undefined && (
                  <>
                    <span className={styles.stat}>
                      {numBlockedItems.toLocaleString('en-US')}
                    </span>{' '}
                    on this page
                  </>
                )}
              </div>

              <div>
                {stats?.numBlockedItemsTotal !== undefined && (
                  <>
                    <span className={styles.stat}>
                      {stats?.numBlockedItemsTotal?.toLocaleString('en-US')}
                    </span>{' '}
                    in total
                  </>
                )}
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
              onClick={
                isBlockPageEnabled ? onClickOpenBlockPageConfirmModal : noop
              }
              disabled={!isBlockPageEnabled}
            >
              Block this page <FaUnlink />
            </button>
          </div>

          <div className={styles.row}>
            <button
              aria-label='Block this site'
              className={cs(
                styles.toggle,
                !isBlockHostEnabled && styles.disabled
              )}
              onClick={
                isBlockHostEnabled ? onClickOpenBlockSiteConfirmModal : noop
              }
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

          <div className={styles.spacer} />

          <div className={styles.row}>
            <button
              aria-label='Pause blocking'
              className={cs(
                styles.toggle,
                !settings?.isPaused && styles.active
              )}
              onClick={onClickToggleIsPaused}
            >
              {settings?.isPaused ? (
                <>
                  Unpause blocking <FaPlay />
                </>
              ) : (
                <>
                  Pause blocking <FaPause />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isBlockSiteConfirmModalOpen}
        confirm='Block site'
        onRequestClose={onClickCloseBlockSiteConfirmModal}
        onConfirm={onClickBlockCurrentHost}
      >
        Are you sure you want to block all of{' '}
        <span className={styles.ban}>{tabInfo?.hostname}</span>?
      </ConfirmModal>

      <ConfirmModal
        isOpen={isBlockPageConfirmModalOpen}
        confirm='Block page'
        onRequestClose={onClickCloseBlockPageConfirmModal}
        onConfirm={onClickBlockCurrentPage}
      >
        Are you sure you want to block this page{' '}
        <span className={styles.ban}>{tabInfo?.normalizedUrl}</span>?
      </ConfirmModal>
    </>
  )
}
