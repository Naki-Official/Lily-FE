/**
 * Solana utilities and initialization functions
 * These are separated from the route handlers to prevent build-time errors
 */

// Initialize Solana Kit with proper error handling
export async function initSolanaKit() {
  try {
    // Dynamic imports to avoid build-time errors
    const bs58 = await import('bs58');
    const { SolanaAgentKit, createSolanaTools } = await import('solana-agent-kit');
    
    // Get environment variables
    const privateKeyBase58 = process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY || '';
    let validKey = privateKeyBase58;
    
    try {
      if (!privateKeyBase58) {
        console.error("Solana private key is missing or empty");
        validKey = 'placeholder';
      } else {
        const decodedPrivateKey = bs58.default.decode(privateKeyBase58);
        if (decodedPrivateKey.length !== 64) {
          console.error("Invalid Solana private key length. It should be 64 bytes.");
          validKey = 'placeholder';
        }
      }
    } catch (keyError) {
      console.error("Error decoding private key:", keyError);
      validKey = 'placeholder';
    }
    
    // Create the kit with the validated key
    const solanaKit = new SolanaAgentKit(
      validKey,
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
      {
        OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        COINGECKO_DEMO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY,
      }
    );
    
    // Create tools with error handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tools: Array<any> = [];
    try {
      tools = createSolanaTools(solanaKit);
    } catch (toolsError) {
      console.error('Error creating Solana tools:', toolsError);
    }
    
    return { solanaKit, tools };
  } catch (error) {
    console.error('Failed to initialize Solana Kit:', error);
    return { solanaKit: null, tools: [] };
  }
}

// Mock transactions for fallback
export const mockTransactions = [
  { 
    timestamp: Date.now() - 86400000, // 1 day ago
    type: 'Send',
    amount: '0.05',
    symbol: 'SOL',
    status: 'Confirmed',
    destination: '8xft7...9j2r',
  },
  { 
    timestamp: Date.now() - 172800000, // 2 days ago
    type: 'Receive',
    amount: '0.2',
    symbol: 'SOL',
    status: 'Confirmed',
    source: '3dfr5...7h2k',
  },
  { 
    timestamp: Date.now() - 259200000, // 3 days ago
    type: 'Swap',
    inputAmount: '1.5',
    inputSymbol: 'USDC',
    outputAmount: '0.01',
    outputSymbol: 'SOL',
    status: 'Confirmed',
  }
];

// Helper functions for token operations
export const tokenAddresses = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'JITO': 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'
}; 