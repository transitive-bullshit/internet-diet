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
  { path: 'fixtures/youtube-0.html', hostname: 'youtube.com' }

  // TODO: handle cases with unique query params instead of pathnames
  // { path: 'fixtures/youtube-1.html', hostname: 'youtube.com' }
]

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

    t.truthy(candidate, 'fixture should have a valid candidate')
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
