import normalizeUrlImpl from 'normalize-url'
import stableStringify from 'fast-json-stable-stringify'
import pMap from 'p-map'
import { sha256 } from 'crypto-hash'
import { EventEmitter } from 'events'
import { BlockRule } from './types'
import * as log from './log'

export declare interface BlockRulesEngine {
  on(event: 'update', listener: (name: string) => void): this
  on(event: string, listener: (...args: unknown[]) => unknown): this
}

export class BlockRulesEngine extends EventEmitter {
  _isPaused = false
  _blockRules: BlockRule[] = []
  _isReadyP: Promise<void>

  constructor() {
    super()

    this._isReadyP = chrome.storage.sync
      .get(['blockRules', 'isPaused'])
      .then(({ blockRules = [], isPaused = false }) => {
        this._blockRules = blockRules
        this._isPaused = isPaused
        log.info('blockRules', this._blockRules)
        log.info('isPaused', this._isPaused)
        this.emit('update')
      })
      .catch((err) => {
        log.error('error loading block rule config', err)
        throw err
      })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return

      if (changes.blockRules) {
        this._blockRules = changes.blockRules.newValue
        log.info('blockRules', this._blockRules)
        this.emit('update')
      }

      if (changes.isPaused) {
        this._isPaused = changes.isPaused.newValue
        log.info('isPaused', this._isPaused)
        this.emit('update')
      }
    })
  }

  get isReady(): Promise<void> {
    return this._isReadyP
  }

  get isPaused(): boolean {
    return this._isPaused
  }

  async addBlockLinkRule({ hostname, url }: { hostname: string; url: string }) {
    const normalizedUrl = normalizeUrl(url)
    let pathname = normalizedUrl || url

    try {
      pathname = new URL(url).pathname
    } catch (err) {
      // ignore invalid urls and fallback to the full input
    }

    return this.addBlockRule({
      type: 'pathname',
      hostname,
      pathname
    })
  }

  async addBlockHostRule({ hostname }: { hostname: string }) {
    return this.addBlockRule({
      type: 'host',
      hostname
    })
  }

  async addBlockRule(blockRule: BlockRule) {
    log.info('addBlockRule', blockRule)
    await this.isReady

    this._blockRules.push(blockRule)
    this._blockRules = await dedupeBlockRules(this._blockRules)

    return chrome.storage.sync.set({ blockRules: this._blockRules })
  }

  async addBlockRules(blockRules: BlockRule[]) {
    log.info('addBlockRules', blockRules)
    await this.isReady

    this._blockRules = this._blockRules.concat(blockRules)
    this._blockRules = await dedupeBlockRules(this._blockRules)

    return chrome.storage.sync.set({ blockRules: this._blockRules })
  }

  isHostBlocked(url: URL | Location): boolean {
    if (this.isPaused) {
      return false
    }

    for (const blockRule of this._blockRules) {
      if (blockRule.type === 'host' && url.hostname === blockRule.hostname) {
        return true
      }
    }

    return false
  }

  isBlockingEnabledForHost(url: URL | Location): boolean {
    if (this.isPaused) {
      return false
    }

    for (const blockRule of this._blockRules) {
      if (url.hostname === blockRule.hostname) {
        return true
      }
    }

    return false
  }

  isUrlBlocked(url: URL | Location): boolean {
    if (this.isPaused) {
      return false
    }

    for (const blockRule of this._blockRules) {
      if (url.hostname !== blockRule.hostname) {
        continue
      }

      switch (blockRule.type) {
        case 'host':
          log.debug('blocking host', url.toString())
          return true

        case 'pathname':
          if (url.pathname.includes(blockRule.pathname)) {
            log.debug('blocking pathname', url.pathname)
            return true
          }
          break

        case 'url': {
          const normalizedUrl = normalizeUrl(url.toString())
          if (
            normalizedUrl.startsWith(normalizeUrl(blockRule.url)) ||
            normalizedUrl.startsWith(blockRule.url)
          ) {
            log.debug('blocking url', { url: url.toString(), normalizedUrl })
            return true
          }
          break
        }
      }
    }

    return false
  }

  isUrlBlockedAsString(url: string): boolean {
    try {
      return this.isUrlBlocked(new URL(url))
    } catch (err) {
      return false
    }
  }

  isItemBlocked(url: URL | Location, text: string | null | undefined): boolean {
    if (this.isPaused) {
      return false
    }

    const sanitizedText = (text || '').toLowerCase().trim()
    if (!sanitizedText) {
      return false
    }

    for (const blockRule of this._blockRules) {
      if (url.hostname !== blockRule.hostname) {
        continue
      }

      switch (blockRule.type) {
        case 'item':
          if (
            new RegExp('\\b' + blockRule.item + 's?\\b', 'i').test(
              sanitizedText
            ) &&
            blockRule.item.length >= sanitizedText.length / 8
          ) {
            log.debug(
              'blocking item',
              `(rule: ${blockRule.item})`,
              sanitizedText
            )
            return true
          }
          break

        default:
          break
      }
    }

    return false
  }
}

export async function dedupeBlockRules(
  blockRules: BlockRule[]
): Promise<BlockRule[]> {
  // stable JSON hashing
  function getHash(input: object): Promise<string> {
    const text = stableStringify(input)
    return sha256(text)
  }

  const hashEntries = await pMap(
    blockRules,
    async (blockRule) => [await getHash(blockRule), blockRule],
    {
      concurrency: 8
    }
  )

  return Object.values(Object.fromEntries(hashEntries))
}

export function normalizeUrl(url?: string): string {
  if (!url) {
    return ''
  }

  try {
    return normalizeUrlImpl(url, {
      forceHttps: true,
      stripProtocol: true,
      stripHash: true,
      stripWWW: true,
      stripTextFragment: true,
      normalizeProtocol: true,
      removeQueryParameters: true,
      removeDirectoryIndex: true
    })
  } catch (err) {
    return ''
  }
}
