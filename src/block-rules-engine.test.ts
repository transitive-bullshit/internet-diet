import test from 'ava'

import { dedupeBlockRules, resolveBlockRules } from './block-rules-engine'
import { defaultBlockRules } from './default-block-rules'

// NOTE: we can't snapshot dedupedBlockRules because their `id` and
// `createdAt` fields will be different every time

test('dedupeBlockRules no-op', async (t) => {
  const rules = JSON.parse(JSON.stringify(defaultBlockRules))
  const dedupedBlockRules = await dedupeBlockRules(resolveBlockRules(rules))
  t.is(dedupedBlockRules.length, rules.length)
})

test('dedupeBlockRules dedupe', async (t) => {
  const rules0 = JSON.parse(JSON.stringify(defaultBlockRules))
  const rules1 = JSON.parse(JSON.stringify(defaultBlockRules))
  const dedupedBlockRules = await dedupeBlockRules(
    resolveBlockRules(rules0).concat(resolveBlockRules(rules1))
  )
  t.is(dedupedBlockRules.length, defaultBlockRules.length)
})
