import test, { ExecutionContext } from 'ava'

import { dedupeBlockRules, resolveBlockRules } from './block-rules-engine'
import { defaultBlockRules } from './default-block-rules'
import { BlockRule } from './types'

// NOTE: we can't snapshot dedupedBlockRules because the `id` and `createdAt`
// fields will be different every time

async function testDedupedBlockRules(
  t: ExecutionContext<unknown>,
  originalBlockRules: BlockRule[],
  dedupedBlockRules: BlockRule[]
) {
  t.is(dedupedBlockRules.length, originalBlockRules.length)
}

test('dedupeBlockRules no-op', async (t) => {
  const rules = resolveBlockRules(JSON.parse(JSON.stringify(defaultBlockRules)))
  const dedupedBlockRules = await dedupeBlockRules(rules)
  await testDedupedBlockRules(t, rules, dedupedBlockRules)
})

test('dedupeBlockRules dedupe', async (t) => {
  const rules0 = resolveBlockRules(
    JSON.parse(JSON.stringify(defaultBlockRules))
  )
  const rules1 = resolveBlockRules(
    JSON.parse(JSON.stringify(defaultBlockRules))
  )
  const dedupedBlockRules = await dedupeBlockRules(
    resolveBlockRules(rules0).concat(resolveBlockRules(rules1))
  )
  await testDedupedBlockRules(t, rules0, dedupedBlockRules)
})
