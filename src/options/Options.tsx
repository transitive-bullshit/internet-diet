import React from 'react'
import { FaCog } from '@react-icons/all-files/fa/FaCog'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'
import { Form, Input, Select } from 'antd'
import { Toaster } from 'react-hot-toast'

import { BlockRulesEngine } from 'block-rules-engine'
import { SettingsStore, getNormalizedUrl } from 'settings-store'
import { BlockRulesTable } from 'components/BlockRulesTable/BlockRulesTable'
import { Settings, BlockEffect } from 'types'

import styles from './Options.module.css'

/*
  TODO:
    - view total stats
    - pause / unpause
    - add new block rules
 */

export const Options = () => {
  const [form] = Form.useForm()
  const [blockRulesEngine, setBlockRulesEngine] =
    React.useState<BlockRulesEngine>()
  const [settingsStore, setSettingsStore] = React.useState<SettingsStore>()
  const [settings, setSettings] = React.useState<Partial<Settings>>()

  const onClickOpenSupportPage = React.useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/transitive-bullshit/internet-diet'
    })
  }, [])

  const onClickOpenOptionsPage = React.useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  // initialize the block rules engine
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

  const onChangeCustomBlockUrl = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({
        ...settings,
        customBlockUrl: e.target.value || ''
      })
    },
    [settings]
  )

  const onChangeBlockEffect = React.useCallback(
    (value: BlockEffect) => {
      setSettings({
        ...settings,
        blockEffect: value
      })
    },
    [settings]
  )

  // sync store settings changes to local
  React.useEffect(() => {
    settingsStore?.on('updated', () => {
      setSettings(settingsStore.settings)
    })
  }, [settingsStore])

  // sync local settings changes to store
  React.useEffect(() => {
    ;(async () => {
      if (!settings || !settingsStore) {
        return
      }

      await settingsStore.updateSettings(settings)
    })()
  }, [settings, settingsStore])

  const isValidCustomBlockUrl = React.useMemo(() => {
    return (
      !settings?.customBlockUrl || !!getNormalizedUrl(settings.customBlockUrl)
    )
  }, [settings])

  return (
    <>
      <Toaster position='top-right' />

      <div className={styles.container}>
        <div className={styles.header} />

        <div className={styles.body}>
          <h1 className={styles.title}>Settings</h1>

          <div className={styles.content}>
            <div className={styles.section}>
              <h4>Blocked Links</h4>

              {blockRulesEngine && (
                <BlockRulesTable
                  blockRulesEngine={blockRulesEngine}
                  type='pathname'
                />
              )}
            </div>

            <div className={styles.section}>
              <h4>Blocked Hosts</h4>

              {blockRulesEngine && (
                <BlockRulesTable
                  blockRulesEngine={blockRulesEngine}
                  type='host'
                />
              )}
            </div>

            <div className={styles.section}>
              <h4>Blocked Items</h4>

              {blockRulesEngine && (
                <BlockRulesTable
                  blockRulesEngine={blockRulesEngine}
                  type='item'
                />
              )}
            </div>

            <div className={styles.section}>
              <h4>General Options</h4>

              <Form form={form} layout='horizontal' className={styles.form}>
                <Form.Item
                  label='Custom blocked page URL'
                  tooltip='Use this to override the page you are redirected to after visiting a blocked page.'
                  hasFeedback={true}
                  validateStatus={isValidCustomBlockUrl ? 'success' : 'error'}
                >
                  <Input
                    placeholder='Default block page'
                    value={settings?.customBlockUrl}
                    onChange={onChangeCustomBlockUrl}
                  />
                </Form.Item>

                <Form.Item
                  label='Block effect'
                  tooltip='This setting controls how page elements are blocked. They can either be blurred out (default) or hidden entirely.'
                >
                  <Select
                    onChange={onChangeBlockEffect}
                    value={settings?.blockEffect}
                  >
                    <Select.Option value='blur'>
                      Blur blocked elements (default)
                    </Select.Option>

                    <Select.Option value='hide'>
                      Hide blocked elements
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Form>
            </div>
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
    </>
  )
}
