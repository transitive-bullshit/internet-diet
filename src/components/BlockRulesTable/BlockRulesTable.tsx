import React from 'react'
import { format } from 'date-fns'
import { Table, Tooltip } from 'antd'

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
        key: 'hostname',
        render: (hostname: string) => {
          let url
          try {
            url = new URL(`https://${hostname}`).toString()
          } catch (err) {
            return hostname
          }

          return (
            <Tooltip title={url}>
              <a href={url} target='_blank' rel='noopener noreferrer'>
                {hostname}
              </a>
            </Tooltip>
          )
        }
      },
      {
        title: 'URL Pathname',
        dataIndex: 'pathname',
        key: 'pathname',
        ellipsis: true,
        width: '30%',
        render: (pathname: string, blockRule: BlockRule) => {
          if (blockRule.type !== 'pathname') {
            return null
          }

          let url
          try {
            url = new URL(pathname, `https://${blockRule.hostname}`).toString()
          } catch (err) {
            return pathname
          }

          return (
            <Tooltip title={url}>
              <a href={url} target='_blank' rel='noopener noreferrer'>
                {pathname}
              </a>
            </Tooltip>
          )
        }
      },
      {
        title: 'Date Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (createdAt: string) => (
          <Tooltip
            title={format(new Date(createdAt), 'MM/dd/yyyy HH:mm:ss OOOO')}
          >
            {format(new Date(createdAt), 'MM/dd/yyyy')}
          </Tooltip>
        )
      },
      {
        title: 'Actions',
        key: 'actions',
        render: () => <span>TODO</span>
      }
    ],
    []
  )

  return <Table columns={columns} dataSource={blockRules} rowKey='id' />
}
