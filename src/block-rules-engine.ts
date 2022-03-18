import pMap from 'p-map'
import { EventEmitter } from 'events'
import { nanoid } from 'nanoid'

import { getStableObjectHash } from './utils'
import { normalizeUrl } from './url-utils'
import { BlockRule } from './types'
import * as log from './log'

// TODO: refactor into BlockRulesStore and BlockRulesEngine?
// TODO: cache _blockRulesByHostname map on every update?

export declare interface BlockRulesEngine {
  on(event: 'update', listener: () => unknown): this
}

export class BlockRulesEngine extends EventEmitter {
  _blockRules: BlockRule[] = []
  _isReadyP: Promise<void>

  constructor() {
    super()

    this._isReadyP = chrome.storage.local
      .get(['blockRules'])
      .then(({ blockRules = [] }) => {
        this._blockRules = blockRules
        log.info('blockRules init', this._blockRules)
        this.emit('update')
      })
      .catch((err) => {
        log.error('error loading block rule config', err)
        throw err
      })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return

      if (changes.blockRules) {
        this._blockRules = changes.blockRules.newValue
        log.info('blockRules update', this._blockRules)
        this.emit('update')
      }
    })
  }

  get isReady(): Promise<void> {
    return this._isReadyP
  }

  get blockRules(): readonly BlockRule[] {
    return this._blockRules as readonly BlockRule[]
  }

  /** returns all of the affected hostnames as a unique, sorted array */
  getHostnames(): string[] {
    return Array.from(this.getHostnamesAsSet()).sort()
  }

  getHostnamesAsSet(): Set<string> {
    return new Set(
      this._blockRules.map((blockRule) => blockRule.hostname).filter(Boolean)
    )
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

  async addBlockRule(blockRule: Partial<BlockRule>) {
    log.info('addBlockRule', blockRule)
    await this.isReady

    this._blockRules.push(resolveBlockRule(blockRule))
    return this._updateBlockRules(this._blockRules)
  }

  async addBlockRules(blockRules: Partial<BlockRule>[]) {
    log.info('addBlockRules', blockRules)
    await this.isReady

    return this._updateBlockRules(
      this._blockRules.concat(blockRules.map(resolveBlockRule))
    )
  }

  async removeBlockRuleById(id: string) {
    log.info('removeBlockRuleById', id)
    await this.isReady

    return this._updateBlockRules(
      this._blockRules.filter((blockRule) => blockRule.id !== id)
    )
  }

  async _updateBlockRules(blockRules: BlockRule[]) {
    this._blockRules = await dedupeBlockRules(blockRules)

    return chrome.storage.local.set({ blockRules: this._blockRules })
  }

  isHostBlocked(url: URL | Location): boolean {
    for (const blockRule of this._blockRules) {
      if (blockRule.type === 'host' && url.hostname === blockRule.hostname) {
        return true
      }
    }

    return false
  }

  isBlockingEnabledForHost(url: URL | Location): boolean {
    for (const blockRule of this._blockRules) {
      if (url.hostname === blockRule.hostname) {
        return true
      }
    }

    return false
  }

  isUrlBlocked(url: URL | Location): boolean {
    for (const blockRule of this._blockRules) {
      if (url.hostname !== blockRule.hostname) {
        continue
      }

      switch (blockRule.type) {
        case 'host':
          return true

        case 'pathname':
          if (url.pathname.includes(blockRule.pathname)) {
            return true
          }
          break

        case 'url': {
          const normalizedUrl = normalizeUrl(url.toString())
          if (
            normalizedUrl.startsWith(normalizeUrl(blockRule.url)) ||
            normalizedUrl.startsWith(blockRule.url)
          ) {
            return true
          }
          break
        }
      }
    }

    return false
  }

  isUrlBlockedAsString(url: string): boolean {
    if (!url) {
      return false
    }

    try {
      return this.isUrlBlocked(new URL(url))
    } catch (err) {
      return false
    }
  }

  isItemBlocked(url: URL | Location, text: string | null | undefined): boolean {
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
            // log.debug(
            //   'blocking item',
            //   `(rule: ${blockRule.item})`,
            //   sanitizedText
            // )
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

export function resolveBlockRule(blockRule: Partial<BlockRule>): BlockRule {
  if (!blockRule.id) {
    blockRule.id = nanoid()
  }

  if (!blockRule.createdAt) {
    blockRule.createdAt = new Date().toISOString()
  }

  return blockRule as BlockRule
}

export function resolveBlockRules(
  blockRules: Partial<BlockRule>[]
): BlockRule[] {
  return blockRules.map(resolveBlockRule)
}

export async function dedupeBlockRules(
  blockRules: BlockRule[]
): Promise<BlockRule[]> {
  const hashEntries = await pMap(
    blockRules,
    async (blockRule) => [
      await getStableObjectHash(blockRule, {
        omit: ['id', 'createdAt']
      }),
      blockRule
    ],
    {
      concurrency: 8
    }
  )

  return Object.values(Object.fromEntries(hashEntries))
}
