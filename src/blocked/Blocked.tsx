import React from 'react'
import { useSearchParam } from 'react-use'
import { FaCog } from '@react-icons/all-files/fa/FaCog'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'

import styles from './Blocked.module.css'

export const Blocked = () => {
  const host = useSearchParam('host')

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
          You blocked this page
          {host && (
            <>
              {' '}
              on{' '}
              <a href={`https://${host}`} className={styles.ban}>
                {host}
              </a>
            </>
          )}
          . It&apos;s probably there for a good reason.
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
