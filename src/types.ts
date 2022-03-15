export type BlockType = 'host' | 'pathname' | 'item' | 'url'

export interface BlockRuleBase {
  hostname: string
  type: BlockType
}

export interface BlockRuleHost extends BlockRuleBase {
  type: 'host'
}

export interface BlockRulePathname extends BlockRuleBase {
  type: 'pathname'
  pathname: string
}

export interface BlockRuleItem extends BlockRuleBase {
  type: 'item'
  item: string
}

export interface BlockRuleUrl extends BlockRuleBase {
  type: 'url'
  url: string
}

export type BlockRule =
  | BlockRuleHost
  | BlockRulePathname
  | BlockRuleItem
  | BlockRuleUrl
