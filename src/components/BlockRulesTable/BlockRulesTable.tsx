import React from 'react'
import { format } from 'date-fns'
import escapeStringRegex from 'escape-string-regexp'
import toast from 'react-hot-toast'
import {
  Table,
  Tooltip,
  Space,
  Button,
  Tag,
  TableColumnType,
  Input
} from 'antd'

import type { BlockRulesEngine } from 'block-rules-engine'
import { BlockRule, BlockRuleType } from 'types'
import { cs } from 'utils'

import styles from './BlockRulesTable.module.css'

export const BlockRulesTable: React.FC<{
  blockRulesEngine: BlockRulesEngine
  type?: BlockRuleType
  title?: string
  className?: string
}> = ({ blockRulesEngine, type, className, title = 'Block Rules' }) => {
  const [blockRules, setBlockRules] = React.useState<BlockRule[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')

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

  const filteredBlockRules = React.useMemo(() => {
    if (!searchQuery) {
      return blockRules
    }

    const searchQueryRe = new RegExp(
      escapeStringRegex(searchQuery.toLowerCase()),
      'i'
    )

    return blockRules.filter((blockRule) => {
      if (searchQueryRe.test(blockRule.hostname)) {
        return true
      }

      if (
        blockRule.type === 'pathname' &&
        searchQueryRe.test(blockRule.pathname)
      ) {
        return true
      }

      if (blockRule.type === 'item' && searchQueryRe.test(blockRule.item)) {
        return true
      }

      return false
    })
  }, [blockRules, searchQuery])

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
        toast.success(`Removed rule for ${blockRule.hostname}`)
      })()
    },
    [blockRulesEngine]
  )

  const onChangeSearchQuery = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    []
  )

  const onSearch = React.useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const columns = React.useMemo<TableColumnType<BlockRule>[]>(
    () =>
      [
        {
          title: 'Hostname',
          dataIndex: 'hostname',
          key: 'hostname',
          sorter: (a: BlockRule, b: BlockRule) =>
            a.hostname.localeCompare(b.hostname),
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
                title={`Menu items appearing on "${blockRule.hostname}" with the word "${item}" will be blocked.`}
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
          defaultSortOrder: 'descend' as any,
          sorter: (a: BlockRule, b: BlockRule) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
    <div className={cs(styles.container, className)}>
      <div className={styles.header}>
        <h4>{title}</h4>

        <Input.Search
          placeholder='search rules'
          allowClear
          onChange={onChangeSearchQuery}
          onSearch={onSearch}
          className={styles.search}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredBlockRules}
        rowKey='id'
        size='small'
      />
    </div>
  )
}
