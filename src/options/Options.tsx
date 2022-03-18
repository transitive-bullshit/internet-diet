import React from 'react'
import { FaCog } from '@react-icons/all-files/fa/FaCog'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'

import { BlockRulesEngine } from 'block-rules-engine'
import { BlockRulesTable } from 'components/BlockRulesTable/BlockRulesTable'
import { BlockRule } from 'types'

import styles from './Options.module.css'

/*
  TODO:
    - view and edit blocked hosts
    - view and edit block links (by host?)
    - view and edit block items (by host?)
    - select block effect
    - custom block link

    /sites - table of hosts
    /sites/<hostname> - settings for a specific host
      - block / unblock host
      - table of blocked links
      - list of text tags for blocked items
 */

export const Options = () => {
  const [blockRulesEngine, setBlockRulesEngine] =
    React.useState<BlockRulesEngine>()

  const onClickOpenSupportPage = React.useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/transitive-bullshit/internet-diet'
    })
  }, [])

  const onClickOpenOptionsPage = React.useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  React.useEffect(() => {
    ;(async () => {
      const engine = new BlockRulesEngine()
      try {
        await engine.isReady
      } catch (err) {
        console.error('error initializing block rules engine', err)
        return
      }

      setBlockRulesEngine(engine)
    })()
  }, [])

  const filter = React.useCallback((blockRule: BlockRule) => {
    return blockRule.type === 'pathname'
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header} />

      <div className={styles.body}>
        <h1>Settings</h1>

        <div className={styles.content}>
          {blockRulesEngine && (
            <BlockRulesTable
              blockRulesEngine={blockRulesEngine}
              filter={filter}
            />
          )}
        </div>
      </div>

      <footer className={styles.footer}>
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
      </footer>
    </div>
  )
}
