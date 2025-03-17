export interface TokenData {
  symbol: string;
  name: string;
  address: string;
  image: string;
  color: string;
}

export const tokens: Record<string, TokenData> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    address: '',
    image: '/images/tokens/bitcoin.svg',
    color: '#F7931A',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '',
    image: '/images/tokens/ethereum.svg',
    color: '#627EEA',
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    address: '',
    image: '/images/tokens/solana.svg',
    color: '#00FFA3',
  },
  DOGE: {
    symbol: 'DOGE',
    name: 'Dogecoin',
    address: '',
    image: '/images/tokens/dogecoin.svg',
    color: '#C3A634',
  },
  SHIB: {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    address: '',
    image: '/images/tokens/shiba.svg',
    color: '#FF3B30',
  },
  AI16Z: {
    symbol: 'AI16Z',
    name: 'ai16z',
    address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC.png',
    color: '#FF6B6B',
  },
  KWEEN: {
    symbol: 'KWEEN',
    name: 'KWEEN',
    address: 'DEf93bSt8dx58gDFCcz4CwbjYZzjwaRBYAciJYLfdCA9',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/DEf93bSt8dx58gDFCcz4CwbjYZzjwaRBYAciJYLfdCA9.png',
    color: '#4ECDC4',
  },
  TNSR: {
    symbol: 'TNSR',
    name: 'TNSR',
    address: 'HHoXk7WursT9DLBBhHzBWBbuQkfvvoNyHKpJi61mpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/HHoXk7WursT9DLBBhHzBWBbuQkfvvoNyHKpJi61mpump.png',
    color: '#45B7D1',
  },
  OPUS: {
    symbol: 'OPUS',
    name: 'OPUS',
    address: '9JhFqCA21MoAXs2PTaeqNQp2XngPn1PgYr2rsEVCpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/9JhFqCA21MoAXs2PTaeqNQp2XngPn1PgYr2rsEVCpump.png',
    color: '#96CEB4',
  },
  NAVAL: {
    symbol: 'NAVAL',
    name: 'NAVAL',
    address: '7wM4MnbsPsG95A3WhZgbrPWvMtydKmJjqKr2ZVJVpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/7wM4MnbsPsG95A3WhZgbrPWvMtydKmJjqKr2ZVJVpump.png',
    color: '#FF9F1C',
  },
  JARVIS: {
    symbol: 'JARVIS',
    name: 'Jarvis',
    address: 'CmpuL8k9KY3NrpfDRoJrVmuwd1zRMFRUxX55avyGpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/CmpuL8k9KY3NrpfDRoJrVmuwd1zRMFRUxX55avyGpump.png',
    color: '#2EC4B6',
  },
  WAIFU: {
    symbol: 'WAIFU',
    name: 'WAIFU',
    address: '3yPEZDVrzcYUsjbpg5BuYoQqzfn6AVjs3S6kW29gGJAS',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/3yPEZDVrzcYUsjbpg5BuYoQqzfn6AVjs3S6kW29gGJAS.png',
    color: '#FF0A54',
  },
  WHISP: {
    symbol: 'WHISP',
    name: 'WHISP',
    address: 'whispF7G9DHaojYHe2cdhRX5EMJzGBdqq7R57kL6inL',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/whispF7G9DHaojYHe2cdhRX5EMJzGBdqq7R57kL6inL.png',
    color: '#FF477E',
  },
  FXN: {
    symbol: 'FXN',
    name: 'fxn',
    address: '92cRC6kV5D7TiHX1j56AbkPbffo9jwcXxSDQZ8Mopump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/92cRC6kV5D7TiHX1j56AbkPbffo9jwcXxSDQZ8Mopump.png',
    color: '#FF0A54',
  },
  VERA: {
    symbol: 'VERA',
    name: 'VERA',
    address: '5SXx7DqZAwnYwRxhBdkcV78RdJrzvCJjRxLmoXdbpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/5SXx7DqZAwnYwRxhBdkcV78RdJrzvCJjRxLmoXdbpump.png',
    color: '#E71D36',
  },
  KEKE: {
    symbol: 'KEKE',
    name: 'KEKE',
    address: 'Gp8GVGPc8QCe4Jn6ryG5YKokG5bjKycATEzqpeyspump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/Gp8GVGPc8QCe4Jn6ryG5YKokG5bjKycATEzqpeyspump.png',
    color: '#FF9F1C',
  },
  AIT: {
    symbol: 'AIT',
    name: 'AIT',
    address: 'D4G7rpcQBF5oVQwBzoDwHPiweJ5RYvuEVGdxqmPApump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/D4G7rpcQBF5oVQwBzoDwHPiweJ5RYvuEVGdxqmPApump.png',
    color: '#011627',
  },
  AVA: {
    symbol: 'AVA',
    name: 'AVA',
    address: 'DKu9kykSfbN5LBfFXtNNDPaX35o4Fv6vJ9FKk7pZpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/DKu9kykSfbN5LBfFXtNNDPaX35o4Fv6vJ9FKk7pZpump.png',
    color: '#FF477E',
  },
  MOE: {
    symbol: 'MOE',
    name: 'MOE',
    address: '8xzoj8mVmXtBQm6d2euJGFPvQ2QsTV5R8cdexi2qpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/8xzoj8mVmXtBQm6d2euJGFPvQ2QsTV5R8cdexi2qpump.png',
    color: '#7209B7',
  },
  ARC: {
    symbol: 'ARC',
    name: 'arc',
    address: '61V8vBaqAGMpgDQi4JcAwo1dmBGHsyhzodcPqnEVpump',
    image:
      'https://dd.dexscreener.com/ds-data/tokens/solana/61V8vBaqAGMpgDQi4JcAwo1dmBGHsyhzodcPqnEVpump.png',
    color: '#4361EE',
  },
};
