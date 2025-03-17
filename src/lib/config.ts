export const config = {
  // Feature flags
  features: {
    useExpressForTrades: true, // Set to false when migrating to Next.js API routes
    streamingChat: true,
  },
  
  // API endpoints
  api: {
    trades: process.env.NEXT_PUBLIC_USE_EXPRESS_API === 'true' 
      ? 'http://localhost:YOUR_EXPRESS_PORT/api/trades'
      : '/api/trades',
    chat: '/api/chat',
  },
  
  // Solana configuration
  solana: {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
    network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  },
}; 