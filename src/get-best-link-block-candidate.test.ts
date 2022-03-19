import test from 'ava'
import fs from 'fs'
import { JSDOM } from 'jsdom'

import { normalizeUrl } from './url-utils'
import { getBestLinkBlockCandidate } from './get-best-link-block-candidate'

// ----------------------------------------------------------------------
// NOTE: enable this if tests fail for verbose logging
// ----------------------------------------------------------------------
const verbose = false

const fixtures = [
  { path: 'fixtures/amazon-0.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/amazon-1.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/amazon-2.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/amazon-3.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/amazon-fresh-0.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/amazon-fresh-1.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/amazon-fresh-2.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/amazon-fresh-3.html', hostname: 'www.amazon.com' },
  { path: 'fixtures/youtube-0.html', hostname: 'youtube.com' },
  { path: 'fixtures/postmates-0.html', hostname: 'postmates.com' },
  { path: 'fixtures/postmates-1.html', hostname: 'postmates.com' },
  { path: 'fixtures/postmates-2.html', hostname: 'postmates.com' },
  { path: 'fixtures/caviar-0.html', hostname: 'trycaviar.com' },
  { path: 'fixtures/caviar-1.html', hostname: 'trycaviar.com' },
  { path: 'fixtures/caviar-2.html', hostname: 'trycaviar.com' },
  { path: 'fixtures/grubhub-0.html', hostname: 'grubhub.com' },
  { path: 'fixtures/grubhub-1.html', hostname: 'grubhub.com' },
  { path: 'fixtures/seamless-0.html', hostname: 'seamless.com' },
  { path: 'fixtures/seamless-1.html', hostname: 'seamless.com' },
  { path: 'fixtures/seamless-2.html', hostname: 'seamless.com' },
  { path: 'fixtures/doordash-0.html', hostname: 'doordash.com' },
  { path: 'fixtures/doordash-1.html', hostname: 'doordash.com' },
  { path: 'fixtures/doordash-2.html', hostname: 'doordash.com' },
  { path: 'fixtures/doordash-3.html', hostname: 'doordash.com' },
  { path: 'fixtures/ubereats-0.html', hostname: 'ubereats.com' },
  { path: 'fixtures/ubereats-2.html', hostname: 'ubereats.com' },
  { path: 'fixtures/delivery-com-0.html', hostname: 'delivery.com' },
  { path: 'fixtures/delivery-com-1.html', hostname: 'delivery.com' },
  { path: 'fixtures/delivery-com-2.html', hostname: 'delivery.com' },
  { path: 'fixtures/delivery-com-3.html', hostname: 'delivery.com' },
  { path: 'fixtures/instacart-0.html', hostname: 'instacart.com' },
  { path: 'fixtures/instacart-1.html', hostname: 'instacart.com' },
  { path: 'fixtures/instacart-2.html', hostname: 'instacart.com' },
  { path: 'fixtures/instacart-3.html', hostname: 'instacart.com' },
  { path: 'fixtures/walmart-0.html', hostname: 'walmart.com' },
  { path: 'fixtures/walmart-1.html', hostname: 'walmart.com' },
  { path: 'fixtures/walmart-2.html', hostname: 'walmart.com' },
  { path: 'fixtures/walmart-3.html', hostname: 'walmart.com' },
  { path: 'fixtures/walmart-grocery-0.html', hostname: 'walmart.com' },
  { path: 'fixtures/walmart-grocery-1.html', hostname: 'walmart.com' }

  // TODO: includes a single link to a separate domain u.cornershopapp.com/store/5200
  // { path: 'fixtures/ubereats-1.html', hostname: 'ubereats.com' },

  // TODO: handle cases with unique query params instead of pathnames
  // { path: 'fixtures/youtube-1.html', hostname: 'youtube.com' }
]

// TODO: also test starting from each possible sub-element to ensure the result
// is the same as starting from the root

for (const fixture of fixtures) {
  test(`getBestLinkBlockCandidate ${fixture.path}`, (t) => {
    const html = fs.readFileSync(fixture.path, 'utf-8')
    const dom = new JSDOM(html, {
      url: `https://${fixture.hostname}/__test__`
    })
    const root = dom.window.document.body.firstChild as HTMLElement

    if (verbose) {
      console.log(fixture.path, fixture.hostname)
    }

    const candidate = getBestLinkBlockCandidate(root, {
      document: dom.window.document,
      log: !!verbose
    })

    t.truthy(candidate, 'fixture should produce a valid candidate')
    t.truthy(candidate?.element)
    t.truthy(candidate?.link)
    t.truthy(candidate?.link.href)

    if (verbose) {
      console.log(
        fixture.path,
        fixture.hostname,
        '=>',
        normalizeUrl(candidate?.link.href)
      )
    }
  })
}
