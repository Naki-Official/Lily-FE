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
    const isVercel = typeof process.env.VERCEL === 'string' && process.env.VERCEL === '1';
    
    // Add more detailed debug logging
    console.log('Initializing Solana Kit with:');
    console.log('- isServer:', isServer);
    console.log('- isBuildTime:', isBuildTime);
    console.log('- isVercel:', isVercel);
    console.log('- NEXT_PHASE:', process.env.NEXT_PHASE);
    console.log('- Has RPC URL:', !!process.env.NEXT_PUBLIC_RPC_URL);
    console.log('- Has private key:', !!process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY);
    
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
    
    console.log('Private key length:', privateKeyBase58 ? privateKeyBase58.length : 0);
    
    // Ensure we have a non-empty RPC URL
    const rpcUrl = typeof process.env.NEXT_PUBLIC_RPC_URL === 'string' && process.env.NEXT_PUBLIC_RPC_URL
      ? process.env.NEXT_PUBLIC_RPC_URL
      : 'https://api.mainnet-beta.solana.com';
    
    console.log('Using RPC URL:', rpcUrl);
    
    let validKey = 'placeholder'; // Use placeholder as the default
    let useFallbackWallet = false; // Track if we need to use fallback
    
    // Attempt to decode and validate the key
    if (privateKeyBase58 && privateKeyBase58.length > 0) {
      try {
        const decodedPrivateKey = bs58.decode(privateKeyBase58);
        console.log('Decoded private key length:', decodedPrivateKey.length);
        
        if (decodedPrivateKey.length === 64) {
          // We have a valid key, use it
          validKey = privateKeyBase58;
          console.log('Valid private key detected - using real wallet');
        } else {
          console.error("Invalid Solana private key length. It should be 64 bytes.");
          useFallbackWallet = true;
        }
      } catch (decodeError) {
        console.error("Error decoding private key:", decodeError);
        useFallbackWallet = true;
      }
    } else {
      console.error("Solana private key is missing or empty");
      useFallbackWallet = true;
    }
    
    // If we need a fallback wallet during development, create a demo one
    if (useFallbackWallet && !isVercel) {
      console.log('Creating local fallback wallet for development');
      
      // Create a SolanaAgentKit instance with a placeholder key
      const solanaKit = new SolanaAgentKit(
        'placeholder', // Placeholder key - won't work for real operations
        rpcUrl,
        {
          OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
          COINGECKO_DEMO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY || '',
        }
      );
      
      // Override methods for demo purposes
      // @ts-expect-error - Intentionally overriding readonly property
      solanaKit.wallet_address = 'DemoWaLLeTaddREsS111111111111111111111';
      
      // @ts-expect-error - Overriding method
      solanaKit.getBalance = async () => "4.20";
      
      console.log('Created fallback wallet for local development');
      return { solanaKit, tools: [] };
    }
    
    // For Vercel deployments, we want to try to use the actual key
    // even if it seems invalid - to match localhost behavior
    if (isVercel) {
      console.log('Running on Vercel, attempting to use provided key regardless of validation');
      validKey = privateKeyBase58 || 'placeholder';
    }
    
    // Create the kit with the key (either validated or forced on Vercel)
    console.log('Creating SolanaAgentKit with key length:', validKey.length);
    const solanaKit = new SolanaAgentKit(
      validKey,
      rpcUrl,
      {
        OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        COINGECKO_DEMO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY || '',
      }
    );
    
    console.log('SolanaKit created successfully');
    
    // Create tools with error handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tools: Array<any> = [];
    try {
      tools = createSolanaTools(solanaKit);
      console.log('Solana tools created successfully, count:', tools.length);
    } catch (toolsError) {
      console.error('Error creating Solana tools:', toolsError);
    }
    
    return { solanaKit, tools };
  } catch (error) {
    console.error('Failed to initialize Solana Kit:', error);
    
    try {
      // Last resort fallback - create a minimal wrapper
      console.log('Creating emergency fallback mock');
      
      const mockWallet = {
        wallet_address: 'EmergencyFallbackWallet111111111111111',
        getBalance: async () => "9.99",
        // Add minimal methods needed for the app to function
      };
      
      return { 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        solanaKit: mockWallet as any,
        tools: [] 
      };
    } catch (fallbackError) {
      console.error('Even fallback creation failed:', fallbackError);
      return { solanaKit: null, tools: [] };
    }
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