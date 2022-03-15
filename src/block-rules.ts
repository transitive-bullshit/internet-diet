import { BlockRule } from './types'

export const blockRules: BlockRule[] = [
  {
    hostname: 'postmates.com',
    type: 'pathname',
    blockedPathnameWords: [
      'mcdonalds',
      'burger-king',
      '7-eleven',
      'dunkin',
      '99-cent-supreme-pizza',
      'marthas-breakfast-sandwiches-1117-broadway',
      'LPAvJw9xUn-qcF9uAhfUcA'
    ],
    blockedItems: ['coke', 'soda', 'pepsi']
  },
  {
    hostname: 'digg.com',
    type: 'host'
  },
  {
    hostname: 'discord.com',
    type: 'url',
    url: 'https://discord.com/channels/908462637761826896/908462638541963285'
  }
]
