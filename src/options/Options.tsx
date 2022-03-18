import React from 'react'
import { FaCog } from '@react-icons/all-files/fa/FaCog'
import { FaQuestion } from '@react-icons/all-files/fa/FaQuestion'
import { FaPlay } from '@react-icons/all-files/fa/FaPlay'
import { FaPause } from '@react-icons/all-files/fa/FaPause'
import { Form, Input, Select, Row, Col, Statistic, Tooltip } from 'antd'
import toast, { Toaster } from 'react-hot-toast'

import { BlockRulesEngine } from 'block-rules-engine'
import { SettingsStore, getNormalizedUrl } from 'settings-store'
import { StatsStore } from 'stats-store'
import { BlockRulesTable } from 'components/BlockRulesTable/BlockRulesTable'
import { Settings, Stats, BlockEffect } from 'types'
import { cs } from 'utils'

import styles from './Options.module.css'

export const Options = () => {
  const [form] = Form.useForm()
  const [blockRulesEngine, setBlockRulesEngine] =
    React.useState<BlockRulesEngine>()

  const [settingsStore, setSettingsStore] = React.useState<SettingsStore>()
  const [settings, setSettings] = React.useState<Partial<Settings>>()

  const [statsStore, setStatsStore] = React.useState<StatsStore>()
  const [stats, setStats] = React.useState<Partial<Stats>>()
  const [toastId, setToastId] = React.useState<string>()

  const onClickOpenSupportPage = React.useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/transitive-bullshit/internet-diet'
    })
  }, [])

  const onClickOpenOptionsPage = React.useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const onClickToggleIsPaused = React.useCallback(() => {
    const isPaused = !settings?.isPaused
    setSettings({
      ...settings,
      isPaused: isPaused
    })

    if (toastId) {
      toast.dismiss(toastId)
    }

    if (isPaused) {
      setToastId(
        toast.success('Blocking is now paused across all sites', {
          duration: 5000
        })
      )
    } else {
      setToastId(
        toast.success('Blocking is now enabled across all sites', {
          duration: 5000
        })
      )
    }
  }, [settings, toastId])

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
            <section className={styles.section}>
              <h4>Stats</h4>

              <Row gutter={16} justify='center' style={{ textAlign: 'center' }}>
                <Col span={8}>
                  {stats?.numBlockedLinksTotal !== undefined && (
                    <Statistic
                      title='Total Links Blocked'
                      value={stats?.numBlockedLinksTotal}
                    />
                  )}
                </Col>

                <Col span={8}>
                  {stats?.numBlockedItemsTotal !== undefined && (
                    <Statistic
                      title='Total Menu Items Blocked'
                      value={stats?.numBlockedItemsTotal}
                    />
                  )}
                </Col>
              </Row>

              {/* <div className={styles.stats}>
                <div>
                  {stats?.numBlockedLinksTotal !== undefined && (
                    <>
                      <span className={styles.stat}>
                        {stats?.numBlockedLinksTotal?.toLocaleString('en-US')}
                      </span>{' '}
                      links blocked in total
                    </>
                  )}
                </div>

                <div>
                  {stats?.numBlockedItemsTotal !== undefined && (
                    <>
                      <span className={styles.stat}>
                        {stats?.numBlockedItemsTotal?.toLocaleString('en-US')}
                      </span>{' '}
                      items blocked in total
                    </>
                  )}
                </div>
              </div> */}
            </section>

            <section className={styles.section}>
              <h4>Blocked Links</h4>

              {blockRulesEngine && (
                <BlockRulesTable
                  blockRulesEngine={blockRulesEngine}
                  type='pathname'
                />
              )}
            </section>

            <section className={styles.section}>
              <h4>Blocked Hosts</h4>

              {blockRulesEngine && (
                <BlockRulesTable
                  blockRulesEngine={blockRulesEngine}
                  type='host'
                />
              )}
            </section>

            <section className={styles.section}>
              <h4>Blocked Menu Items</h4>

              {blockRulesEngine && (
                <BlockRulesTable
                  blockRulesEngine={blockRulesEngine}
                  type='item'
                />
              )}
            </section>

            <section className={styles.section}>
              <h4>General Options</h4>

              <Form form={form} layout='horizontal' className={styles.form}>
                <Form.Item
                  label='Custom blocked page URL'
                  tooltip='Use this to override the page you are redirected to after visiting a blocked link.'
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

                <Form.Item>
                  <Tooltip
                    title={
                      settings?.isPaused
                        ? 'Blocking is currently paused'
                        : 'Blocking is currently enabled'
                    }
                  >
                    <button
                      aria-label={
                        settings?.isPaused
                          ? 'Unpause blocking'
                          : 'Pause blocking'
                      }
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
                  </Tooltip>
                </Form.Item>
              </Form>
            </section>
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
