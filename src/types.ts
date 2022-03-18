export type BlockRuleType = 'host' | 'pathname' | 'item' | 'url'
export type BlockEffect = 'blur' | 'hide'

export interface BlockRuleBase {
  hostname: string
  type: BlockRuleType

  // auto-generated by BlockRulesEngine
  id: string
  createdAt: string
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

export interface Settings {
  customBlockUrl: string
  blockEffect: BlockEffect
}
