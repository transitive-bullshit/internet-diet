import React from 'react'
import { FaCog } from '@react-icons/all-files/fa/FaCog'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'

import styles from './Blocked.module.css'

export const Blocked = () => {
  const onClickOpenSupportPage = React.useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/transitive-bullshit/internet-diet'
    })
  }, [])

  const onClickOpenOptionsPage = React.useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header} />

      <div className={styles.body}>
        <h1>Blocked</h1>

        <p>
          You put this page on your blocked list. It&apos;s probably there for a
          good reason.
        </p>

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
    </div>
  )
}
