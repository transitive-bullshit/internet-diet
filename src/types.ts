export type BlockType = 'host' | 'pathname' | 'url'

export interface BlockRuleBase {
  hostname: string
  type: BlockType
}

export interface BlockRuleHost extends BlockRuleBase {
  type: 'host'
}

export interface BlockRulePathname extends BlockRuleBase {
  type: 'pathname'
  blockedPathnameWords: string[]
  blockedItems: string[]
}

export interface BlockRuleUrl extends BlockRuleBase {
  type: 'url'
  url: string
}

export type BlockRule = BlockRuleHost | BlockRulePathname | BlockRuleUrl
