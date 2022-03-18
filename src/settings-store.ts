import normalizeUrl from 'normalize-url'
import { EventEmitter } from 'events'

import { getStableObjectHash } from './utils'
import { Settings } from './types'
import * as log from './log'

export declare interface SettingsStore {
  on(event: 'update', listener: () => unknown): this
}

export class SettingsStore extends EventEmitter {
  _settings: Settings = resolveSettings()
  _isReadyP: Promise<void>

  constructor() {
    super()

    this._isReadyP = chrome.storage.local
      .get(['settings'])
      .then(({ settings }) => {
        this._settings = resolveSettings(settings)
        log.debug('settings init', this._settings)
        this.emit('update')
      })
      .catch((err) => {
        log.error('error loading settings from storage', err)
        throw err
      })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return

      if (changes.settings) {
        this._settings = resolveSettings(changes.settings.newValue)
        log.debug('settings update', this._settings)
        this.emit('update')
      }
    })
  }

  get isReady(): Promise<void> {
    return this._isReadyP
  }

  get settings(): Settings {
    return this._settings
  }

  async updateSettings(settings: Partial<Settings>) {
    await this.isReady

    const newSettings = resolveSettings({
      ...this._settings,
      ...settings
    })

    const oldSettingsHash = await getStableObjectHash(this._settings)
    const newSettingsHash = await getStableObjectHash(newSettings)
    if (oldSettingsHash === newSettingsHash) {
      log.debug('updateSettings dedupe', newSettings, this._settings)
      return
    } else {
      this._settings = newSettings
      log.debug('updateSettings', this._settings)
      return chrome.storage.local.set({ settings: this._settings })
    }
  }

  getSanitizedCustomBlockUrl(): string {
    return getSanitizedUrl(this._settings.customBlockUrl)
  }
}

export function resolveSettings(settings?: Partial<Settings>): Settings {
  return {
    isPaused: false,
    customBlockUrl: '',
    blockEffect: 'blur',
    ...settings
  }
}

export function getSanitizedUrl(url?: string | null): string {
  if (!url) {
    return ''
  }

  try {
    // normalize the URL and then make sure it is valid
    return new URL(normalizeUrl(url)).toString()
  } catch (err) {
    return ''
  }
}
