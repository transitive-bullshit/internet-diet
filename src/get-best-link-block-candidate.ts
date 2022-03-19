import {
  normalizeUrl,
  normalizeUrlLight,
  getCandidateIdForUrl,
  querySelectorAllInclusive
} from './url-utils'
import * as log from './log'

export interface LinkBlockCandidate {
  link: HTMLAnchorElement
  element: HTMLElement
}

export interface LinkBlockCandidateOptions {
  document?: Document
  log?: boolean
}

export interface LinkBlockCandidateSubOptions {
  document: Document
  hostname: string
  log?: boolean
}

export function getBestLinkBlockCandidate(
  target: HTMLElement,
  opts: LinkBlockCandidateOptions = {}
): LinkBlockCandidate | null {
  const document = opts.document ?? window.document
  const hostname = document.location.hostname
  const subOpts = { ...opts, document, hostname }
  // const containerCandidate = target.closest('li')?.parentElement
  let link: HTMLAnchorElement | null = null
  let element: HTMLElement | null = null
  let currentElement: HTMLElement = target

  if (opts.log) {
    log.debug('getBest', target)
  }

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

    NOTE: This heuristic is critical for the "smart selection" UX in order
    to make it feel natural for non-technical users to select element/link 
    pairs to block.
  */
  do {
    const urlLinkPairs = querySelectorAllInclusive<HTMLAnchorElement>(
      'a',
      currentElement
    )
      .map((link) => [getSanitizedUrlForHost(link.href, subOpts), link])
      .filter((pair) => !!pair[0])
    const uniqueUrlsToLinks: { [url: string]: HTMLAnchorElement } =
      Object.fromEntries(urlLinkPairs)
    const numUniqueUrls = Object.keys(uniqueUrlsToLinks).length

    /*
      numUniqueIds is all about handling cases where there are multiple links
      to a specific object (like a product or a restaurant), but some of those
      links point to different URLs for that object.

      In Amazon's case, for example, an individual product listing can contain
      links to the product page, product reviews, customer reviews, featured
      deals, etc.

      The one thing all of these links have in common, however, is that they
      all contain the same very obvious unique ID.
    */
    const uniqueUrlLinkPairs = Object.entries(uniqueUrlsToLinks)
    const candidateIdLinkPairs = uniqueUrlLinkPairs.map(([url, link]) => [
      getCandidateIdForUrl(url) || url,
      link
    ])
    const uniqueIdsToLinks: { [id: string]: HTMLAnchorElement } =
      Object.fromEntries(candidateIdLinkPairs)
    const numUniqueIds = Object.keys(uniqueIdsToLinks).length

    let isUniqueUrlPrefix = false
    let uniqueUrlPrefixLink: HTMLAnchorElement | null = null

    if (numUniqueUrls > 1) {
      /*
        Handle the case where there is a single long url and there are one or 
        more links to parent urls.

        For example, if we have the following list of URLs:

          twitter.com/transitive_bs
          twitter.com/transitive_bs
          twitter.com/transitive_bs
          twitter.com/transitive_bs/status/1358199505280262150
        
        Then it's highly likely that they all refer to the same list-item-like
        candidate (eg, an individual tweet in this case).

        In this case, we want to focus on the most specific URL as it likely
        provides the detailed link, with the other parent URLs being to related
        resources (like the user's profile in this case).
      */

      uniqueUrlLinkPairs.sort((a, b) => a[0].length - b[0].length)
      const longestUrlLinkPair =
        uniqueUrlLinkPairs[uniqueUrlLinkPairs.length - 1]
      let shorterUrlsAreSubUrls = true

      for (let i = 0; i < uniqueUrlLinkPairs.length - 1; ++i) {
        const urlLinkPair = uniqueUrlLinkPairs[i]
        if (!longestUrlLinkPair[0].startsWith(urlLinkPair[0])) {
          shorterUrlsAreSubUrls = false
        }
      }

      if (shorterUrlsAreSubUrls) {
        isUniqueUrlPrefix = true
        uniqueUrlPrefixLink = longestUrlLinkPair[1]
      }
    }

    // const lis = querySelectorAllInclusive<HTMLLIElement>('li', currentElement)
    // const numLis = lis.length
    // const isCurrentElementLi =
    //   currentElement.tagName === 'LI' || currentElement === lis[0]

    if (opts.log) {
      log.debug('getBest', {
        numUniqueUrls,
        numUniqueIds,
        isUniqueUrlPrefix,
        uniqueUrlLinks: uniqueUrlLinkPairs.map((pair) => pair[0])
      })
    }

    if (numUniqueUrls > 1 && numUniqueIds > 1 && !isUniqueUrlPrefix) {
      // we've traversed too far
      if (opts.log) {
        log.debug('getBest break 1')
      }
      break
    }

    // check for potential candidate element / link pairs
    if (numUniqueUrls === 1) {
      element = currentElement
      link = Object.values(uniqueUrlsToLinks)[0]
    } else if (numUniqueIds === 1) {
      element = currentElement
      link = Object.values(uniqueIdsToLinks)[0]
    } else if (isUniqueUrlPrefix) {
      element = currentElement
      link = uniqueUrlPrefixLink
    }

    const { parentElement } = currentElement

    if (!parentElement || parentElement.tagName === 'BODY') {
      // we've traversed too far
      if (opts.log) {
        log.debug('getBest break 2')
      }
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
  { hostname, document }: LinkBlockCandidateSubOptions
): string | null {
  // log.debug('getSanitizedUrlForHost', { url, hostname })
  if (!url) {
    return null
  }

  const normalizedDocumentUrl = normalizeUrlLight(document.location.href)
  if (normalizedDocumentUrl && url.startsWith(`${normalizedDocumentUrl}#`)) {
    // disregard hash links
    return null
  }

  if (url.startsWith('javascript:')) {
    // disregard inline scripts
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
  if (!normalizedUrl) {
    return null
  }

  // TODO: this sort of special-casing should be avoided if at all possible.
  // Leaning on list-item elements would potentially help more with sites
  // like amazon which utilize them properly.
  if (
    hostname.includes('amazon') &&
    (normalizedUrl.includes('/customer-reviews') ||
      normalizedUrl.includes('/product-reviews') ||
      normalizedUrl.includes('/storefront') ||
      normalizedUrl.includes('/goldbox') ||
      normalizedUrl.includes('/bestsellers'))
  ) {
    return ''
  }

  return normalizedUrl
}
