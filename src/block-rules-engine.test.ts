import test from 'ava'

import { dedupeBlockRules, resolveBlockRules } from './block-rules-engine'
import { defaultBlockRules } from './default-block-rules'

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
