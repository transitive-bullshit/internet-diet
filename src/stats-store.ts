import { EventEmitter } from 'events'

import { getStableObjectHash } from './utils'
import { Stats } from './types'
import * as log from './log'

export declare interface StatsStore {
  on(event: 'update', listener: () => unknown): this
}

export class StatsStore extends EventEmitter {
  _stats: Stats = resolveStats()
  _isReadyP: Promise<void>

  constructor() {
    super()

    this._isReadyP = chrome.storage.sync
      .get(['stats'])
      .then(({ stats }) => {
        this._stats = resolveStats(stats)
        log.debug('stats init', this._stats)
        this.emit('update')
      })
      .catch((err) => {
        log.error('error loading stats from storage', err)
        throw err
      })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return

      if (changes.stats) {
        this._stats = resolveStats(changes.stats.newValue)
        log.debug('stats update', this._stats)
        this.emit('update')
      }
    })
  }

  get isReady(): Promise<void> {
    return this._isReadyP
  }

  get stats(): Stats {
    return this._stats
  }

  async updateStats(stats: Partial<Stats>) {
    await this.isReady

    const newStats = resolveStats({
      ...this._stats,
      ...stats
    })

    const oldStatsHash = await getStableObjectHash(this._stats)
    const newStatsHash = await getStableObjectHash(newStats)
    if (oldStatsHash === newStatsHash) {
      log.debug('updateStats dedupe', newStats, this._stats)
      return
    } else {
      this._stats = newStats
      log.debug('updateStats', this._stats)
      return chrome.storage.sync.set({ stats: this._stats })
    }
  }
}

export function resolveStats(stats?: Partial<Stats>): Stats {
  return {
    numBlockedItemsTotal: 0,
    numBlockedLinksTotal: 0,
    ...stats
  }
}
