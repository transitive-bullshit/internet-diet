import React from 'react'
import { format } from 'date-fns'
import { Table, Tooltip, Space, Button, Tag } from 'antd'

import type { BlockRulesEngine } from 'block-rules-engine'
import { BlockRule, BlockRuleType } from 'types'

// import styles from './BlockRuleTable.module.css'

export const BlockRulesTable: React.FC<{
  blockRulesEngine: BlockRulesEngine
  type?: BlockRuleType
}> = ({ blockRulesEngine, type }) => {
  const [blockRules, setBlockRules] = React.useState<BlockRule[]>([])

  const filter = React.useMemo(
    () => (blockRule: BlockRule) => {
      if (type === undefined) {
        return true
      } else {
        return blockRule.type === type
      }
    },
    [type]
  )

  const updateBlockRules = React.useCallback(() => {
    setBlockRules(blockRulesEngine.blockRules.filter(filter))
  }, [blockRulesEngine, filter])

  React.useEffect(() => {
    updateBlockRules()
    blockRulesEngine.on('update', updateBlockRules)
  }, [blockRulesEngine, updateBlockRules])

  const onClickRemoveBlockRule = React.useCallback(
    (blockRule: BlockRule) => {
      ;(async () => {
        await blockRulesEngine.removeBlockRuleById(blockRule.id)
      })()
    },
    [blockRulesEngine]
  )

  const columns = React.useMemo(
    () =>
      [
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
          render: (pathname: string, blockRule: BlockRule) => {
            if (blockRule.type !== 'pathname') {
              return null
            }

            let url
            try {
              url = new URL(
                pathname,
                `https://${blockRule.hostname}`
              ).toString()
            } catch (err) {
              return pathname
            }

            return (
              <Tooltip title={url}>
                <a
                  href={url}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{
                    wordBreak: 'break-all'
                  }}
                >
                  {pathname}
                </a>
              </Tooltip>
            )
          }
        },
        {
          title: 'Item Text',
          dataIndex: 'item',
          key: 'item',
          render: (item: string, blockRule: BlockRule) => {
            if (blockRule.type !== 'item') {
              return null
            }

            return (
              <Tooltip
                title={`Items appearing on "${blockRule.hostname}" with the word "${item}" will be blocked.`}
              >
                <Tag color='blue'>{item}</Tag>
              </Tooltip>
            )
          }
        },
        {
          title: 'Date Added',
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
          render: (_: any, blockRule: BlockRule) => (
            <Space size='middle'>
              <Button
                danger
                type='text'
                shape='round'
                onClick={() => onClickRemoveBlockRule(blockRule)}
              >
                Remove rule
              </Button>
            </Space>
          )
        }
      ].filter((column) => {
        switch (type) {
          case 'pathname':
            return column.key !== 'item'

          case 'host':
            return column.key !== 'pathname' && column.key !== 'item'

          case 'item':
            return column.key !== 'pathname'

          default:
            return true
        }
      }),
    [type, onClickRemoveBlockRule]
  )

  return (
    <Table columns={columns} dataSource={blockRules} rowKey='id' size='small' />
  )
}
