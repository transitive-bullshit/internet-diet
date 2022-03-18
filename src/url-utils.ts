import normalizeUrlImpl from 'normalize-url'
import mem from 'mem'

import select from 'select-dom'

export interface LinkBlockCandidate {
  link: HTMLAnchorElement
  element: HTMLElement
}

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

/*
  querySelectorAll doesn't include the base node, which is really useful for
  the getBestLinkBlockCandidate algorithm, so here is a version which returns
  results inclusive of the base node.
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

export function getBestLinkBlockCandidate(
  target: HTMLElement
): LinkBlockCandidate | null {
  const { hostname } = document.location
  // const containerCandidate = target.closest('li')?.parentElement
  let link: HTMLAnchorElement | null = null
  let element: HTMLElement | null = null
  let currentElement: HTMLElement = target

  // log.debug('getBest', target)

  /*
    Traverse up the DOM tree, starting from the target node. On each 
    iteration, we assess whether the current node could be a viable element 
    containing a single unique link that's blockable with respect to the 
    current host.
    
    Once we get to a point where the current node contains too many links, 
    we know we've gone too far, so we bail out.

    The resulting candidate represents the highest DOM node that fulfilled
    our blocking criteria (or null if no valid candidates were found).

    NOTE: I'm sure this algorithm could be optimized, but it doesn't appear
    to be a problem in practice for the time being. Specifically, we're
    doing a lot of redundant sub-tree traversals with the `select.all` calls
    on each step up the tree.

    NOTE: This algorithm is critical for the "smart selection" UX in order
    to make it feel natural for non-technical users to select element/link 
    pairs to block.
  */
  do {
    const urlLinkPairs = querySelectorAllInclusive<HTMLAnchorElement>(
      'a',
      currentElement
    )
      .map((link) => [getSanitizedUrlForHost(link.href, hostname), link])
      .filter((pair) => !!pair[0])
    const uniqueUrlsToLinks: { [url: string]: HTMLAnchorElement } =
      Object.fromEntries(urlLinkPairs)
    const numUniqueUrls = Object.keys(uniqueUrlsToLinks).length

    const uniqueUrlLinkPairs = Object.entries(uniqueUrlsToLinks)
    const candidateIdLinkPairs = uniqueUrlLinkPairs.map(([url, link]) => [
      getCandidateIdForUrl(url) || url,
      link
    ])
    const uniqueIdsToLinks: { [id: string]: HTMLAnchorElement } =
      Object.fromEntries(candidateIdLinkPairs)
    const numUniqueIds = Object.keys(uniqueIdsToLinks).length

    // const lis = querySelectorAllInclusive<HTMLLIElement>('li', currentElement)
    // const numLis = lis.length
    // const isCurrentElementLi =
    //   currentElement.tagName === 'LI' || currentElement === lis[0]

    // log.debug('getBest', {
    //   target,
    //   currentElement,
    //   numUniqueUrls,
    //   numLis,
    //   isCurrentElementLi
    // })

    if (numUniqueUrls > 1 && numUniqueIds > 1) {
      // we've traversed too far
      // log.debug('getBest break 1')
      break
    }

    if (numUniqueUrls === 1) {
      // we have a new candidate element / link pair
      element = currentElement
      link = Object.values(uniqueUrlsToLinks)[0]
    } else if (numUniqueIds === 1) {
      // we have a new candidate element / link pair
      element = currentElement
      link = Object.values(uniqueIdsToLinks)[0]
    }

    const { parentElement } = currentElement

    if (!parentElement || parentElement === document.body) {
      // we've traversed too far
      // log.debug('getBest break 2')
      break
    }

    // continue traversing up the DOM tree
    currentElement = parentElement

    // eslint-disable-next-line no-constant-condition
  } while (true)

  // log.debug('getBest post', element, link)
  // return the most recent valid candidate if one exists
  if (element && link) {
    return {
      element,
      link
    }
  } else {
    return null
  }
}

export function getSanitizedUrlForHost(
  url: string,
  hostname: string
): string | null {
  if (!url) {
    return null
  }

  try {
    const urlHostname = new URL(url).hostname
    if (!hostname.includes(urlHostname) && !urlHostname.includes(hostname)) {
      return null
    }
  } catch (err) {
    // malformed URL
    return null
  }

  const normalizedUrl = normalizeUrl(url)
  if (normalizedUrl) {
    // TODO: this sort of special-casing should be avoided if at all possible.
    // Leaning on list-item elements would potentially help more with sites
    // like amazon which utilize them properly.
    if (
      hostname.includes('amazon') &&
      (normalizedUrl.includes('/customer-reviews/') ||
        normalizedUrl.includes('/product-reviews/') ||
        normalizedUrl.includes('/storefront/'))
    ) {
      return ''
    }
  }

  return normalizedUrl
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

// goal is to get as specific / unique as possible
export const getCandidateIdForUrl = mem((url: string) => {
  const candidateIds = _getCandidateIdsForUrl(url)

  if (candidateIds.length) {
    return candidateIds[candidateIds.length - 1]
  } else {
    return null
  }
})
