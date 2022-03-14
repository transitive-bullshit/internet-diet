export type BlockType = 'host' | 'partial' | 'url'

export interface BlockRuleBase {
  hostname: string
  type: BlockType
}

export interface BlockRuleHost extends BlockRuleBase {
  type: 'host'
}

export interface BlockRulePartial extends BlockRuleBase {
  type: 'partial'
  pathnameBlockedWords: string[]
}

export interface BlockRuleUrl extends BlockRuleBase {
  type: 'url'
  url: string
}

export type BlockRule = BlockRuleHost | BlockRulePartial | BlockRuleUrl
