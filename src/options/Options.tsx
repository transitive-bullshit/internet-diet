import React from 'react'
import { FaPlay } from '@react-icons/all-files/fa/FaPlay'
import { FaPause } from '@react-icons/all-files/fa/FaPause'
import { Form, Input, Select, Row, Col, Statistic, Tooltip, Button } from 'antd'
import toast, { Toaster } from 'react-hot-toast'

import { Footer } from 'components/Footer/Footer'
import { BlockRulesTable } from 'components/BlockRulesTable/BlockRulesTable'
import { BlockRulesEngine } from 'block-rules-engine'
import { SettingsStore, getNormalizedUrl } from 'settings-store'
import { StatsStore } from 'stats-store'
import { Settings, Stats, BlockEffect } from 'types'

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
      setToastId(toast.success('Blocking is now paused across all sites'))
    } else {
      setToastId(toast.success('Blocking is now enabled across all sites'))
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
      <Toaster
        position='top-right'
        toastOptions={{
          success: {
            duration: 5000
          },
          error: {
            duration: 8000
          }
        }}
      />

      <div className={styles.container}>
        <div className={styles.header} />

        <div className={styles.body}>
          <h1 className={styles.title}>Settings</h1>

          <div className={styles.content}>
            <section className={styles.section}>
              <Row gutter={16} justify='center' style={{ textAlign: 'center' }}>
                <Col span={8}>
                  {stats?.numBlockedLinksTotal !== undefined && (
                    <Statistic
                      title='Links blocked in total'
                      value={stats?.numBlockedLinksTotal}
                    />
                  )}
                </Col>

                <Col span={8}>
                  {stats?.numBlockedItemsTotal !== undefined && (
                    <Statistic
                      title='Menu items blocked in total'
                      value={stats?.numBlockedItemsTotal}
                    />
                  )}
                </Col>
              </Row>
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
                  tooltip='Override the page you are redirected to after visiting a blocked link.'
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
                    <Button
                      block
                      type={settings?.isPaused ? 'primary' : 'default'}
                      danger={!settings?.isPaused}
                      className={styles.toggle}
                      onClick={onClickToggleIsPaused}
                    >
                      {settings?.isPaused ? (
                        <>
                          Resume blocking <FaPlay />
                        </>
                      ) : (
                        <>
                          Pause blocking <FaPause />
                        </>
                      )}
                    </Button>
                  </Tooltip>
                </Form.Item>
              </Form>
            </section>
          </div>
        </div>

        <Footer showOptions={false} />
      </div>
    </>
  )
}
