import React from 'react'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'
import { FaCog } from '@react-icons/all-files/fa/FaCog'

import { cs } from 'utils'
import styles from './Footer.module.css'

export const Footer: React.FC<{
  showSupport?: boolean
  showOptions?: boolean
  className?: string
}> = ({ showSupport = true, showOptions = true, className }) => {
  const onClickOpenSupportPage = React.useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/transitive-bullshit/internet-diet'
    })
  }, [])

  const onClickOpenOptionsPage = React.useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  return (
    <footer className={cs(styles.footer, className)}>
      <div className={styles.copyright}>Copyright 2022 Travis Fischer</div>

      <div className={styles.links}>
        {showSupport && (
          <button
            aria-label='Support'
            className={styles.button}
            onClick={onClickOpenSupportPage}
          >
            <FaQuestion />
          </button>
        )}

        {showOptions && (
          <button
            aria-label='Settings'
            className={styles.button}
            onClick={onClickOpenOptionsPage}
          >
            <FaCog />
          </button>
        )}
      </div>
    </footer>
  )
}
