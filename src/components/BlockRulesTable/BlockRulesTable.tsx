import React from 'react'
import Table from 'rc-table'

import type { BlockRulesEngine } from 'block-rules-engine'
import { BlockRule } from 'types'

// import styles from './BlockRuleTable.module.css'

export const BlockRulesTable: React.FC<{
  blockRulesEngine: BlockRulesEngine
  filter?: (blockRule: BlockRule) => boolean
}> = ({ blockRulesEngine, filter = () => true }) => {
  const [blockRules, setBlockRules] = React.useState<BlockRule[]>([])

  const updateBlockRules = React.useCallback(() => {
    setBlockRules(blockRulesEngine.blockRules.filter(filter))
  }, [blockRulesEngine, filter])

  React.useEffect(() => {
    updateBlockRules()
    blockRulesEngine.on('update', updateBlockRules)
  }, [blockRulesEngine, updateBlockRules])

  const columns = React.useMemo(
    () => [
      {
        title: 'Hostname',
        dataIndex: 'hostname',
        key: 'hostname'
      },
      {
        title: 'URL Pathname',
        dataIndex: 'pathname',
        key: 'pathname'
      },
      {
        title: 'Date Created',
        dataIndex: 'createdAt',
        key: 'createdAt'
      },
      {
        title: 'Actions',
        render: () => <span>TODO</span>
      }
    ],
    []
  )

  return <Table columns={columns} data={blockRules} />
}
