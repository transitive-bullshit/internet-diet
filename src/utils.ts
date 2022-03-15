import normalizeUrlImpl from 'normalize-url'
import { blockRules } from './block-rules'

export const cs = (...classes: Array<string | undefined | false>) =>
  classes.filter((a) => !!a).join(' ')

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
        for (const keyword of blockRule.blockedPathnameWords) {
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

export function isItemBlocked(
  url: URL | Location,
  text: string | null | undefined
): boolean {
  const sanitizedText = (text || '').toLowerCase().trim()
  if (!sanitizedText) {
    return false
  }

  for (const blockRule of blockRules) {
    if (url.hostname !== blockRule.hostname) {
      continue
    }

    switch (blockRule.type) {
      case 'pathname':
        for (const blockRuleItem of blockRule.blockedItems) {
          if (
            new RegExp('\\b' + blockRuleItem + 's?\\b', 'i').test(
              sanitizedText
            ) &&
            blockRuleItem.length >= sanitizedText.length / 8
          ) {
            console.log(
              'internet diet',
              'blocking item',
              `(rule: ${blockRuleItem})`,
              sanitizedText
            )
            return true
          }
        }

        break

      default:
        break
    }
  }

  return false
}
