import bs58 from 'bs58';
import { createSolanaTools, SolanaAgentKit } from 'solana-agent-kit';

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

// Cache for CoinGecko IDs to avoid repeated API calls
let coinGeckoIdsCache: Record<string, string> | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Initialize Solana Agent Kit with proper configuration
// We create it outside the handler to reuse the same instance
const privateKeyBase58 = process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY!;

// Validate the private key format
try {
  const decodedPrivateKey = bs58.decode(privateKeyBase58);
  if (decodedPrivateKey.length !== 64) {
    console.error("Invalid Solana private key length. It should be 64 bytes.");
  }
} catch (error) {
  console.error("Error decoding private key:", error);
}

// Create the Solana Agent Kit instance with all available API keys
export const solanaKit = new SolanaAgentKit(
  privateKeyBase58,
  process.env.NEXT_PUBLIC_RPC_URL!,
  {
    OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    COINGECKO_DEMO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY,
  }
);

// Create LangChain tools for more advanced use cases
const tools = createSolanaTools(solanaKit);

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

// Initialize Solana Agent Kit with environment variables
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Process the user's message
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    // Use a simple approach to get a response from the Solana Agent Kit
    // This will handle any Solana-related commands or queries
    let response = "I'm sorry, I couldn't process your request.";
    
    // First, determine the user's intent
    const intentPatterns = [
      { intent: 'balance', patterns: [/balance/i, /how much sol/i, /how many sol/i] },
      { intent: 'address', patterns: [/wallet/i, /address/i] },
      { intent: 'transactions', patterns: [/transaction/i, /history/i, /recent activity/i] },
      { intent: 'swap', patterns: [/swap/i, /exchange/i, /convert/i, /trade/i] },
      { intent: 'send', patterns: [/send/i, /transfer/i, /pay/i] },
      { intent: 'price', patterns: [/price/i, /worth/i, /value/i, /cost/i, /market/i] },
      { intent: 'help', patterns: [/help/i, /command/i, /what can you do/i, /capabilities/i] },
      { intent: 'recommendations', patterns: [/recommend/i, /suggestion/i, /top coin/i, /best coin/i, /ai recommend/i, /what to buy/i, /what should i buy/i, /investment/i] }
    ];
    
    // Determine the most likely intent
    let detectedIntent = '';
    for (const { intent, patterns } of intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(userMessage)) {
          detectedIntent = intent;
          break;
        }
      }
      if (detectedIntent) break;
    }
    
    // Handle the request based on the detected intent
    switch (detectedIntent) {
      case 'balance':
        try {
          const balance = await solanaKit.getBalance();
          response = `Your current balance is ${balance} SOL.`;
        } catch (err) {
          console.error('Error getting balance:', err);
          response = "I couldn't retrieve your balance at the moment. Please try again later.";
        }
        break;
        
      case 'address':
        try {
          // Access the wallet_address property
          const address = solanaKit.wallet_address;
          response = `Your wallet address is ${address}.`;
        } catch (err) {
          console.error('Error getting wallet address:', err);
          response = "I couldn't retrieve your wallet address at the moment. Please try again later.";
        }
        break;
        
      case 'transactions':
        // In a real app, you would fetch transactions from the blockchain
        // For now, we'll use mock data
        const transactionsFormatted = mockTransactions.map(tx => {
          if (tx.type === 'Send') {
            return `- ${tx.date}: Sent ${tx.amount} ${tx.token} to ${tx.to} (${tx.status})`;
          } else if (tx.type === 'Receive') {
            return `- ${tx.date}: Received ${tx.amount} ${tx.token} from ${tx.from} (${tx.status})`;
          } else {
            return `- ${tx.date}: Swapped ${tx.amount} ${tx.token} to ${tx.to} (${tx.status})`;
          }
        }).join('\n');
        
        response = `Here are your recent transactions:\n\n${transactionsFormatted}`;
        break;
        
      case 'swap':
        // Handle token swap functionality
        response = "The token swap feature is coming soon! Currently, I can help you check token prices, view your balance, or see transaction history.";
        break;
        
      case 'send':
        // Handle send functionality
        response = "The send tokens feature is coming soon! Currently, I can help you check token prices, view your balance, or see transaction history.";
        break;
        
      case 'price':
        try {
          // This section handles token price queries
          // First, check for specific token mentions using a more precise regex
          const tokenRegexPatterns = [
            /price of (\w+)/i,                  // "price of SOL"
            /(\w+) price/i,                     // "SOL price"
            /how much is (\w+)/i,               // "how much is SOL"
            /what is (\w+) worth/i,             // "what is SOL worth"
            /what is the price of (\w+)/i,      // "what is the price of SOL"
            /how much does (\w+) cost/i,        // "how much does SOL cost"
            /value of (\w+)/i,                  // "value of SOL"
            /(\w+) token/i,                     // "SOL token"
            /\b(sol|usdc|bonk|jto|pyth|wif|sonic)\b/i  // Direct token mention
          ];
          
          let tokenSymbol: string | null = null;
          
          // Try each pattern to find a token match
          for (const pattern of tokenRegexPatterns) {
            const match = userMessage.match(pattern);
            if (match && match[1]) {
              const candidate = match[1].toUpperCase();
              
              // Verify this is actually a known token before accepting it
              if (coinGeckoIdsCache && coinGeckoIdsCache[candidate]) {
                tokenSymbol = candidate;
                break;
              }
            }
          }
          
          // If no match from patterns, try to extract token name from individual words
          if (!tokenSymbol) {
            const words = userMessage.split(/\s+/);
            for (const word of words) {
              // Only consider words that look like potential token symbols (2-5 characters)
              const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
              if (cleanWord.length >= 2 && cleanWord.length <= 5 && 
                  coinGeckoIdsCache && coinGeckoIdsCache[cleanWord]) {
                tokenSymbol = cleanWord;
                break;
              }
            }
          }
          
          // If we found a specific token, get its price
          if (tokenSymbol) {
            // Fetch real-time price data from CoinGecko
            const tokenPrices = await getTokenPrices([tokenSymbol]);
            
            if (tokenPrices && tokenPrices[tokenSymbol]) {
              const tokenData = tokenPrices[tokenSymbol];
              const changeSign = tokenData.change >= 0 ? '+' : '';
              response = `Current ${tokenSymbol} price: $${tokenData.price.toFixed(tokenSymbol === 'BONK' ? 8 : 4)} (${changeSign}${tokenData.change.toFixed(2)}% in 24h)`;
            } else {
              response = `I couldn't retrieve price information for ${tokenSymbol} from CoinGecko. The API may be unavailable or rate limited.`;
            }
          } 
          // If no specific token was identified, show popular token prices
          else {
            // Show prices for popular tokens instead of all tokens
            const popularTokens = ['SOL', 'USDC', 'BONK', 'JTO', 'PYTH', 'WIF'];
            const tokenPrices = await getTokenPrices(popularTokens);
            
            if (tokenPrices && Object.keys(tokenPrices).length > 0) {
              const pricesFormatted = Object.entries(tokenPrices)
                .map(([token, data]) => {
                  const price = token === 'BONK' ? data.price.toFixed(8) : data.price.toFixed(4);
                  const changeSign = data.change >= 0 ? '+' : '';
                  return `- ${token}: $${price} (${changeSign}${data.change.toFixed(2)}%)`;
                })
                .join('\n');
              
              response = `Here are the current prices for popular tokens from CoinGecko:\n\n${pricesFormatted}\n\nTo check a specific token, please mention its symbol (e.g., "What is the price of SOL?")`;
            } else {
              response = "I couldn't retrieve token prices from CoinGecko. The API may be unavailable or rate limited.";
            }
          }
        } catch (priceError) {
          console.error('Error handling price request:', priceError);
          response = "I encountered an error while fetching token prices from CoinGecko. The API may be unavailable or rate limited.";
        }
        break;
        
      case 'help':
        response = "I can help you with various Solana operations, including:\n\n" +
                  "- Checking your wallet balance\n" +
                  "- Viewing your wallet address\n" +
                  "- Getting real-time token prices from CoinGecko\n" +
                  "- Viewing transaction history\n" +
                  "- Sending SOL or tokens (coming soon)\n" +
                  "- Swapping tokens (coming soon)\n" +
                  "- Providing AI-recommended top coins for investment\n\n" +
                  "What would you like to do?";
        break;
        
      case 'recommendations': {
        try {
          // Fetch top coin recommendations from our API
          // Use a proper URL construction that works in both development and production
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          
          // For server-side API routes, we can use a relative URL
          const topCoinsUrl = '/api/top-coins';
          
          console.log('Attempting to fetch recommendations from:', topCoinsUrl);
          
          let topCoins;
          try {
            const topCoinsResponse = await fetch(topCoinsUrl, { 
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            
            if (!topCoinsResponse.ok) {
              throw new Error(`Failed to fetch recommendations: ${topCoinsResponse.status}`);
            }
            
            topCoins = await topCoinsResponse.json();
          } catch (fetchError) {
            console.error('Error fetching from internal API:', fetchError);
            
            // Try fetching directly from the external API as a fallback
            console.log('Attempting direct fallback to external API');
            const externalApiUrl = 'http://35.240.191.75:8000/api/top-agents';
            const apiKey = 'vFZMxMy2BdsBY37rVd404uIuZpre3Txeprk7uD6KzdSlG7EbCBBisxZjr9W1JEU7';
            
            const externalResponse = await fetch(externalApiUrl, {
              method: 'GET',
              headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (!externalResponse.ok) {
              throw new Error(`External API fallback failed: ${externalResponse.status}`);
            }
            
            topCoins = await externalResponse.json();
          }
          
          if (!topCoins || topCoins.length === 0) {
            response = "I don't have any coin recommendations at the moment. Please try again later.";
            break;
          }
          
          // Format the top coins data for display
          const recommendationsFormatted = topCoins
            .slice(0, 3) // Limit to top 3 recommendations
            .map((coin: TopCoin, index: number) => {
              const token = coin.token;
              const geckoData = token.coinGeckoData;
              
              return `${index + 1}. ${token.name} (${token.ticker})\n` +
                     `   Price: $${token.tokenPrice.toFixed(8)}\n` +
                     `   Market Cap: $${Math.round(token.marketCap).toLocaleString()}\n` +
                     `   24h Change: ${geckoData.price_change_percentage_24h.toFixed(2)}%\n` +
                     `   Entry Price: $${token.entryPrice.toFixed(8)}\n` +
                     `   Take Profit: $${token.takeProfit.toFixed(8)}\n` +
                     `   Score: ${coin.finalScore.toFixed(2)}\n`;
            })
            .join('\n');
          
          // Check if we're using mock data (by checking a specific property that would only be in our mock data)
          const isMockData = topCoins.some((coin: TopCoin) => 
            coin.token.name === "HYPE3" && coin.token.ticker === "COOL" && 
            coin.token.contractAddress === "9iQFnxrDDMFrhLx2pYJCDeqN3wFuaBimQkUnZQHNpump"
          );
          
          const mockDataDisclaimer = isMockData ? 
            "\n\n⚠️ Note: The AI recommendation service is currently unavailable. These are sample recommendations for demonstration purposes only." : "";
          
          response = `Here are my top coin recommendations based on AI analysis:\n\n${recommendationsFormatted}\n\nThese recommendations are based on market data, social metrics, and AI analysis. Always do your own research before investing.${mockDataDisclaimer}`;
        } catch (error) {
          console.error('Error fetching coin recommendations:', error);
          response = "I'm sorry, I couldn't retrieve coin recommendations at the moment. Please try again later.";
        }
        break;
      }
        
      default:
        response = "I can help you with Solana operations like checking your balance, viewing your wallet address, and more. What would you like to do?";
    }
    
    // Return the response
    return new Response(JSON.stringify({ response }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return new Response(JSON.stringify({ 
      response: "I'm sorry, I encountered an error processing your request. Please try again later." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 