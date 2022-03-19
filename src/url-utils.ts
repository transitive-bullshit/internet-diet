import select from 'select-dom'
import normalizeUrlImpl from 'normalize-url'
import mem from 'mem'

/**
 * Returns a normalized, simplified, sanitized version of a URL that's
 * meant to be used as a basis for comparisons and clean UI display.
 *
 * Examples:
 * https://t.com/foo/bar/?baz=123&d=1 => t.com/foo/bar
 * http://www.t.com:80/foo/#hash => t.com/foo
 * https://cat.dog.t.com:80/foo/index.php => cat.dog.t.com/foo
 */
export const normalizeUrl = mem((url?: string) => {
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
})

/**
 * querySelectorAll doesn't include the base node, which is really useful for
 * the getBestLinkBlockCandidate algorithm, so here is a version which returns
 * results inclusive of the base node.
 */
export function querySelectorAllInclusive<T extends Element>(
  selector: string,
  baseElement: Element
): T[] {
  const inclusiveElements = (
    baseElement.matches(selector) ? [baseElement] : []
  ) as T[]
  const exclusiveElements = select.all(selector, baseElement) as T[]

  return inclusiveElements.concat(exclusiveElements)
}

export function getClosestLinkBlockCandidate(element: HTMLElement) {
  return element.closest('li') || element.closest('div') || element
}

export function getClosestItemBlockCandidate(element: HTMLElement) {
  return element.closest('li') || element.closest('div') || element
}

const idPatterns = [
  {
    // uuid
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
  },
  {
    // mongodb
    re: /\b[a-f\d]{24}\b/gi
  },
  // TODO: don't include slashes in result (from amazon)
  // /\/[a-z0-9]{10,}\//gi
  {
    // amazon
    re: /\b[a-z0-9]{10,}\b/gi,
    not: [/^[a-z]*$/i]
  },
  { re: /\b[a-z0-9_-]{10,}\b/gi, not: [/^[a-z]*$/i, /^[a-z]+[-_][a-z]+$/i] },
  { re: /\b[a-z0-9_-]{8,}\b/gi, not: [/^[a-z]*$/i, /^[a-z]+[-_][a-z]+$/i] }
  // these seem too lenient; we'd rather be a bit conservative here
  // { re: /\b[a-z0-9_-]{7,}\b/gi, not: [/^[a-z]*$/i] }
  // { re: /\b[a-z0-9_-]{6,}\b/gi, not: [/^[a-z]*$/i] },
  // { re: /\b[a-z0-9_-]{5,}\b/gi, not: [/^[a-z]*$/i] }
]

// goal is to get as specific / unique as possible
export function _getCandidateIdsForUrl(url: string): string[] {
  for (const idPattern of idPatterns) {
    const matches = url.match(idPattern.re)

    if (matches) {
      if (idPattern.not) {
        const matches2 = matches.filter((id) => {
          for (const notRe of idPattern.not) {
            if (notRe.test(id)) {
              return false
            }
          }

          return true
        })

        if (matches2.length) {
          return matches2
        }
      } else {
        return matches
      }
    }
  }

  return []
}

/**
 * Attempt to extract a unique database-like identifier from the given URL.
 *
 * NOTE: this function assumes the input has already been sanitized / normalized
 * via `normalizeUrl`.
 *
 * Examples:
 *
 * amazon.com/gp/product/B01ITIOG5Y/ref=pd_alm_fs_merch
 *  => B01ITIOG5Y
 *
 * test.com/store/items/item_51472338984
 *  => item_51472338984
 *
 * postmates.com/store/starbucks/01e381f0-adb1-5fb9-b65b-8414428a5811
 *  => 01e381f0-adb1-5fb9-b65b-8414428a5811
 */
export const getCandidateIdForUrl = mem((url: string) => {
  const candidateIds = _getCandidateIdsForUrl(url)

  if (candidateIds.length) {
    return candidateIds[candidateIds.length - 1]
  } else {
    return null
  }
})
