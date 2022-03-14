import { BlockRule } from './types'
import normalizeUrlImpl from 'normalize-url'

const blockRules: BlockRule[] = [
  {
    hostname: 'postmates.com',
    type: 'pathname',
    pathnameBlockedWords: [
      'mcdonalds',
      '7-eleven',
      'burger-king',
      '99-cent-supreme-pizza',
      'marthas-breakfast-sandwiches-1117-broadway',
      'LPAvJw9xUn-qcF9uAhfUcA'
    ]
  },
  {
    hostname: 'digg.com',
    type: 'host'
  },
  {
    hostname: 'discord.com',
    type: 'url',
    url: 'https://discord.com/channels/908462637761826896/908462638541963285'
  }
]

export function normalizeUrl(url: string): string {
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
}

export function isHostBlocked(url: URL | Location): boolean {
  for (const blockRule of blockRules) {
    if (blockRule.type === 'host' && url.hostname === blockRule.hostname) {
      return true
    }
  }

  return false
}

export function isBlockingEnabledForHost(url: URL | Location): boolean {
  for (const blockRule of blockRules) {
    if (url.hostname === blockRule.hostname) {
      return true
    }
  }

  return false
}

export function isUrlBlocked(url: URL | Location): boolean {
  for (const blockRule of blockRules) {
    if (url.hostname !== blockRule.hostname) {
      continue
    }

    switch (blockRule.type) {
      case 'host':
        console.log('blocking host', url.toString())
        return true

      case 'pathname':
        for (const keyword of blockRule.pathnameBlockedWords) {
          if (url.pathname.includes(keyword)) {
            console.log('blocking pathname', url.pathname)
            return true
          }
        }

        break
      case 'url': {
        const normalizedUrl = normalizeUrl(url.toString())
        if (normalizedUrl.startsWith(normalizeUrl(blockRule.url))) {
          console.log('blocking url', { url: url.toString(), normalizedUrl })
          return true
        }

        break
      }

      default:
        break
    }
  }

  return false
}

export function isUrlBlockedAsString(url: string): boolean {
  try {
    return isUrlBlocked(new URL(url))
  } catch (err) {
    return false
  }
}
