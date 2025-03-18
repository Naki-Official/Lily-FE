import bs58 from 'bs58';
import { NextResponse } from 'next/server';
import { SolanaAgentKit } from 'solana-agent-kit';

// Mock transaction data (in a real app, this would come from the blockchain)
const mockTransactions = [
  { 
    id: 'tx1', 
    type: 'Send', 
    amount: '0.05', 
    token: 'SOL', 
    to: '8xft7...9j2r', 
    date: '2023-06-15', 
    status: 'Confirmed' 
  },
  { 
    id: 'tx2', 
    type: 'Receive', 
    amount: '0.2', 
    token: 'SOL', 
    from: '3dfr5...7h2k', 
    date: '2023-06-14', 
    status: 'Confirmed' 
  },
  { 
    id: 'tx3', 
    type: 'Swap', 
    amount: '1.5', 
    token: 'USDC', 
    to: '0.01 SOL', 
    date: '2023-06-12', 
    status: 'Confirmed' 
  }
];

// CoinGecko token ID mapping
const coinGeckoIds = {
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'BONK': 'bonk',
  'JTO': 'jito-network',
  'PYTH': 'pyth-network',
  'WIF': 'wif-network',
  'SONIC': 'sonic-token'
};

// Add these interfaces at the top of the file, after the existing imports
interface CoinGeckoData {
  symbol: string;
  name: string;
  categories: string[];
  twitter_acc: string | null;
  sentiment_votes_up: number | null;
  sentiment_votes_down: number | null;
  watchlist_users: number;
  market_cap_rank: number;
  description: string;
  current_price: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_14d: number;
  price_change_percentage_30d: number;
  price_change_percentage_60d: number;
}

interface Token {
  name: string;
  slug: string;
  ticker: string;
  creationDate: string;
  profileImageUrl: string;
  contractAddress: string;
  marketCap: number;
  holdersCount: number;
  tokenPrice: number;
  tokenPrice3DaysAgo: number;
  tokenPriceChangePercent: number;
  smartFollowersCount: number;
  mindshare: number;
  mindsharePrevious: number;
  mindshareDelta: number;
  mindshareDeltaPercent: number;
  volume24HoursDeltaPercent: number;
  entryPrice: number;
  takeProfit: number;
  coinGeckoData: CoinGeckoData;
}

interface TopCoin {
  finalScore: number;
  token: Token;
}

// Function to fetch all coins from CoinGecko API
async function fetchCoinGeckoIds() {
  try {
    // First, check if CoinGecko API is available
    try {
      const pingUrl = 'https://api.coingecko.com/api/v3/ping';
      const pingResponse = await fetch(pingUrl);
      if (!pingResponse.ok) {
        console.error('CoinGecko API ping failed:', pingResponse.status, pingResponse.statusText);
        return null;
      }
      console.log('CoinGecko API ping successful');
    } catch (pingError) {
      console.error('Error pinging CoinGecko API:', pingError);
      return null;
    }
    
    // Fetch the complete list of coins from CoinGecko
    const url = 'https://api.coingecko.com/api/v3/coins/list';
    console.log('Fetching CoinGecko coins list from URL:', url);
    
    // Implement retry mechanism
    let retries = 3;
    let response;
    let lastError;
    
    while (retries > 0) {
      try {
        response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          break; // Success, exit the retry loop
        }
        
        lastError = `CoinGecko API error: ${response.status} ${response.statusText}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);
        
        // If rate limited (429), wait longer before retrying
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (fetchError) {
        lastError = `Fetch error: ${fetchError}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      retries--;
    }
    
    if (!response || !response.ok) {
      console.error('All retries failed:', lastError);
      return null;
    }
    
    const coinsList = await response.json();
    console.log(`Fetched ${coinsList.length} coins from CoinGecko`);
    
    // Create a mapping of symbol (uppercase) to id
    const mapping: Record<string, string> = {};
    
    // Process the coins list to create the mapping
    // Note: Some symbols might be duplicated, so we prioritize popular coins
    const popularCoins = ['solana', 'usd-coin', 'bonk', 'jito-network', 'pyth-network', 'wif-network', 'sonic-token'];
    
    // First add our known popular coins to ensure they're prioritized
    for (const coin of coinsList) {
      if (popularCoins.includes(coin.id)) {
        mapping[coin.symbol.toUpperCase()] = coin.id;
      }
    }
    
    // Then add the rest, but don't overwrite existing entries
    for (const coin of coinsList) {
      if (!mapping[coin.symbol.toUpperCase()]) {
        mapping[coin.symbol.toUpperCase()] = coin.id;
      }
    }
    
    return mapping;
  } catch (error) {
    console.error('Error fetching CoinGecko IDs:', error);
    return null;
  }
}

// Initialize environment variables and configuration
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Cache for CoinGecko IDs to avoid repeated API calls
let coinGeckoIdsCache: Record<string, string> | null = null;
let lastCacheTime = 0;

// Helper function to safely initialize SolanaKit
function initSolanaKit() {
  try {
    const privateKeyBase58 = process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY || '';
    let validKey = privateKeyBase58;

    try {
      if (!privateKeyBase58) {
        console.error("Solana private key is missing or empty");
        validKey = 'placeholder';
      } else {
        const decodedPrivateKey = bs58.decode(privateKeyBase58);
        if (decodedPrivateKey.length !== 64) {
          console.error("Invalid Solana private key length. It should be 64 bytes.");
          validKey = 'placeholder';
        }
      }
    } catch (error) {
      console.error("Error decoding private key:", error);
      validKey = 'placeholder';
    }

    const kit = new SolanaAgentKit(
      validKey,
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
      {
        OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        COINGECKO_DEMO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY,
      }
    );

    return kit;
  } catch (error) {
    console.error("Failed to initialize SolanaKit:", error);
    return null;
  }
}

// Helper function to get token prices from CoinGecko API
async function getTokenPrices(tokenSymbols: string[]) {
  try {
    // Get or refresh the CoinGecko IDs cache
    const now = Date.now();
    if (!coinGeckoIdsCache || now - lastCacheTime > CACHE_DURATION) {
      const fetchedIds = await fetchCoinGeckoIds();
      if (fetchedIds) {
        coinGeckoIdsCache = fetchedIds;
        lastCacheTime = now;
      } else if (!coinGeckoIdsCache) {
        // If we couldn't fetch and don't have a cache, fall back to hardcoded values
        coinGeckoIdsCache = coinGeckoIds;
      }
      // If fetch failed but we have a cache, keep using the existing cache
    }
    
    // Ensure we have a valid cache before proceeding
    if (!coinGeckoIdsCache) {
      console.error('Failed to initialize CoinGecko IDs cache');
      return null;
    }
    
    // First, check if CoinGecko API is available
    try {
      const pingUrl = 'https://api.coingecko.com/api/v3/ping';
      const pingResponse = await fetch(pingUrl);
      if (!pingResponse.ok) {
        console.error('CoinGecko API ping failed:', pingResponse.status, pingResponse.statusText);
        return null;
      }
      console.log('CoinGecko API ping successful');
    } catch (pingError) {
      console.error('Error pinging CoinGecko API:', pingError);
      return null;
    }
    
    // Get CoinGecko IDs for the requested symbols
    const ids = tokenSymbols
      .map(symbol => {
        if (coinGeckoIdsCache) {
          return coinGeckoIdsCache[symbol.toUpperCase()];
        }
        return undefined;
      })
      .filter(id => id !== undefined)
      .join(',');
    
    if (!ids) {
      console.error('No valid CoinGecko IDs found for symbols:', tokenSymbols);
      return null;
    }
    
    // Construct the CoinGecko API URL - use free tier without API key
    const baseUrl = 'https://api.coingecko.com/api/v3';
    
    // Use the simple/price endpoint to get current prices and 24h change
    const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    
    console.log('Fetching CoinGecko data from URL:', url);
    
    // Implement retry mechanism
    let retries = 3;
    let response;
    let lastError;
    
    while (retries > 0) {
      try {
        // Fetch data from CoinGecko
        response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          break; // Success, exit the retry loop
        }
        
        lastError = `CoinGecko API error: ${response.status} ${response.statusText}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);
        
        // If rate limited (429), wait longer before retrying
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (fetchError) {
        lastError = `Fetch error: ${fetchError}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      retries--;
    }
    
    if (!response || !response.ok) {
      console.error('All retries failed:', lastError);
      return null;
    }
    
    const data = await response.json();
    console.log('CoinGecko API response:', JSON.stringify(data));
    
    // Format the price data
    const result: Record<string, { price: number; change: number }> = {};
    
    // Map the results back to token symbols
    for (const symbol of tokenSymbols) {
      const upperSymbol = symbol.toUpperCase();
      const id = coinGeckoIdsCache ? coinGeckoIdsCache[upperSymbol] : undefined;
      
      if (id && data[id] && data[id].usd) {
        result[upperSymbol] = {
          price: data[id].usd || 0,
          change: data[id].usd_24h_change || 0
        };
        console.log(`Successfully mapped ${upperSymbol} price:`, result[upperSymbol]);
      } else {
        console.error(`Failed to get price data for ${upperSymbol} (ID: ${id})`);
        if (id && data[id]) {
          console.error(`Data for ${id}:`, JSON.stringify(data[id]));
        }
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Error fetching token prices from CoinGecko:', error);
    return null;
  }
}

// POST handler for the chat API
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate and normalize the message
    let userMessage = '';
    try {
      userMessage = body.message?.toLowerCase() || '';
    } catch (e) {
      return NextResponse.json({ 
        response: "I couldn't understand your message. Please try again." 
      });
    }
    
    // Process the message at runtime to avoid build-time errors
    const response = await processMessage(userMessage);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Process the user message to generate a response
async function processMessage(userMessage: string): Promise<string> {
  try {
    // Dynamically import the utility functions
    const { initSolanaKit, mockTransactions, tokenAddresses } = await import('@/utils/solana-utils');
    
    // Initialize the Solana kit at runtime
    const { solanaKit, tools } = await initSolanaKit();
    
    // Determine the command from the user message
    let command = '';
    if (userMessage.includes('balance')) {
      command = 'balance';
    } else if (userMessage.includes('address') || userMessage.includes('wallet')) {
      command = 'address';
    } else if (userMessage.includes('price')) {
      command = 'price';
    } else if (userMessage.includes('history') || userMessage.includes('transactions')) {
      command = 'transactions';
    } else if (userMessage.startsWith('swap')) {
      command = 'swap';
    } else if (userMessage.includes('recommendations') || userMessage.includes('suggest') || userMessage.includes('recommend')) {
      command = 'recommend';
    }
    
    // Generate a response based on the command
    let response = '';
    
    switch (command) {
      case 'balance':
        // Implementation for balance command
        response = "Here's your current balance...";
        break;
        
      case 'address':
        // Implementation for address command
        response = "Your wallet address is...";
        break;
        
      case 'price':
        // Implementation for price command
        response = "The current price is...";
        break;
        
      case 'transactions':
        // Implementation for transactions command
        response = "Here are your recent transactions...";
        break;
        
      case 'swap': {
        // Implementation for swap command
        const swapMatch = userMessage.match(/swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/i);
        
        if (!swapMatch) {
          response = "I couldn't understand your swap request. Please use the format: 'Swap [amount] [fromToken] to [toToken]'";
          break;
        }
        
        try {
          const [_, amount, fromToken, toToken] = swapMatch;
          
          // Verify the tokens are supported
          const fromTokenUpper = fromToken.toUpperCase();
          const toTokenUpper = toToken.toUpperCase();
          
          if (!tokenAddresses[fromTokenUpper as keyof typeof tokenAddresses]) {
            response = `Sorry, I don't support swapping from ${fromToken}. Currently supported tokens: SOL, USDC, USDT, BONK, and JITO.`;
            break;
          }
          
          if (!tokenAddresses[toTokenUpper as keyof typeof tokenAddresses]) {
            response = `Sorry, I don't support swapping to ${toToken}. Currently supported tokens: SOL, USDC, USDT, BONK, and JITO.`;
            break;
          }
          
          // Mock response for now, the actual implementation
          // would use the solanaKit here
          response = `Successfully swapped ${amount} ${fromToken} to ${toToken}!`;
        } catch (error) {
          console.error('Error processing swap:', error);
          response = "Sorry, I encountered an error while processing your swap. Please try again later.";
        }
        break;
      }
        
      case 'recommend':
        // Implementation for recommend command
        response = "Here are my recommendations...";
        break;
        
      default:
        response = "I can help you with Solana operations like checking your balance, viewing your wallet address, and more. What would you like to do?";
    }
    
    return response;
  } catch (error) {
    console.error('Error in processMessage:', error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
} 