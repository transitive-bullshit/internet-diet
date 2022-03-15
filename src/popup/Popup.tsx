import React from 'react'

import styles from './Popup.module.css'

export const Popup = () => {
  const [tabTitle, setTabTitle] = React.useState('')
  const [tabBlockInfo, setTabBlockInfo] = React.useState({
    numBlockedItems: 0,
    numBlockedLinks: 0
  })

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
            setTabBlockInfo(response.tabBlockInfo)
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
            setTabBlockInfo(message.tabBlockInfo)
            break
        }

        sendResponse()
        return true
      }
    )
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
          <div>{tabBlockInfo.numBlockedLinks} on this page</div>
        </div>

        <div className={styles.row}>
          <div>Blocked items</div>
          <div>{tabBlockInfo.numBlockedItems} on this page</div>
        </div>
      </div>
    </div>
  )
}
