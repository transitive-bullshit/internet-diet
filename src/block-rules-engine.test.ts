import test from 'ava'

import {
  normalizeUrl,
  dedupeBlockRules,
  resolveBlockRules
} from './block-rules-engine'
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
  t.snapshot(
    normalizeUrl(
      'https://www.seamless.com/menu/empanada-loca-606-5th-ave-brooklyn/310748'
    )
  )
})

test('dedupeBlockRules no-op', async (t) => {
  const dedupedBlockRules = await dedupeBlockRules(
    resolveBlockRules(defaultBlockRules)
  )
  t.is(dedupedBlockRules.length, defaultBlockRules.length)
})

test('dedupeBlockRules dedupe', async (t) => {
  const dedupedBlockRules = await dedupeBlockRules(
    resolveBlockRules(defaultBlockRules).concat(
      resolveBlockRules(defaultBlockRules)
    )
  )
  t.is(dedupedBlockRules.length, defaultBlockRules.length)
})
