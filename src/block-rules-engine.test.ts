import test from 'ava'

import { normalizeUrl, dedupeBlockRules } from './block-rules-engine'
import { defaultBlockRules } from './default-block-rules'

test('normalizeUrl invalid', (t) => {
  t.is(normalizeUrl(), '')
  t.is(normalizeUrl(''), '')
  t.is(normalizeUrl('#'), '')
  t.is(normalizeUrl('#foo'), '')
  t.is(normalizeUrl('/foo'), '')
  t.is(normalizeUrl('/foo/bar'), '')
  t.is(normalizeUrl('://test.com'), '')
})

test('normalizeUrl valid', (t) => {
  t.snapshot(normalizeUrl('test.com'))
  t.snapshot(normalizeUrl('test.com/123'))
  t.snapshot(normalizeUrl('//test.com'))
  t.snapshot(normalizeUrl('https://test.com'))
  t.snapshot(normalizeUrl('https://www.test.com'))
  t.snapshot(normalizeUrl('https://test.com/foo/bar'))
  t.snapshot(normalizeUrl('https://test.com/foo/bar/'))
  t.snapshot(normalizeUrl('https://test.com/foo/bar?foo=bar&cat=dog'))
})

test('dedupeBlockRules no-op', async (t) => {
  const dedupedBlockRules = await dedupeBlockRules(defaultBlockRules)
  t.is(dedupedBlockRules.length, defaultBlockRules.length)
  t.snapshot(dedupedBlockRules)
})

test('dedupeBlockRules dedupe', async (t) => {
  const dedupedBlockRules = await dedupeBlockRules(
    defaultBlockRules.concat(defaultBlockRules)
  )
  t.is(dedupedBlockRules.length, defaultBlockRules.length)
  t.snapshot(dedupedBlockRules)
})
