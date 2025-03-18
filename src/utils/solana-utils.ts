/**
 * Solana utilities and initialization functions
 * These are separated from the route handlers to prevent build-time errors
 */

// Initialize Solana Kit with proper error handling
export async function initSolanaKit() {
  try {
    // Check if we're in a build/SSG environment first
    const isServer = typeof window === 'undefined';
    const isBuildTime = isServer && process.env.NEXT_PHASE === 'phase-production-build';
    
    // If running during build time, return mock data
    if (isBuildTime) {
      console.log('Running in build environment, returning mock Solana Kit');
      return { 
        solanaKit: null, 
        tools: [] 
      };
    }
    
    // Dynamic imports to avoid build-time errors
    const bs58Module = await import('bs58');
    const bs58 = bs58Module.default;
    const { SolanaAgentKit, createSolanaTools } = await import('solana-agent-kit');
    
    // Get environment variables - safely
    const privateKeyBase58 = typeof process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY === 'string' 
      ? process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY.trim() 
      : '';
    
    let validKey = 'placeholder'; // Use placeholder as the default to prevent decode attempts on empty strings
    
    try {
      // Only attempt to decode if the key is a non-empty string
      if (privateKeyBase58 && privateKeyBase58.length > 0) {
        // Safely decode the private key
        try {
          const decodedPrivateKey = bs58.decode(privateKeyBase58);
          if (decodedPrivateKey.length === 64) {
            // Valid key, use it
            validKey = privateKeyBase58;
          } else {
            console.error("Invalid Solana private key length. It should be 64 bytes.");
          }
        } catch (decodeError) {
          console.error("Error decoding private key:", decodeError);
        }
      } else {
        console.error("Solana private key is missing or empty");
      }
    } catch (keyError) {
      console.error("Error processing private key:", keyError);
    }
    
    // Ensure we have a non-empty RPC URL
    const rpcUrl = typeof process.env.NEXT_PUBLIC_RPC_URL === 'string' && process.env.NEXT_PUBLIC_RPC_URL
      ? process.env.NEXT_PUBLIC_RPC_URL
      : 'https://api.mainnet-beta.solana.com';
    
    // Create the kit with the validated key
    const solanaKit = new SolanaAgentKit(
      validKey,
      rpcUrl,
      {
        OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        COINGECKO_DEMO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY || '',
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