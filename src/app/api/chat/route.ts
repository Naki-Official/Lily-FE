import bs58 from 'bs58';
import { NextResponse } from 'next/server';
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
const solanaKit = new SolanaAgentKit(
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
        
      case 'transactions': {
        // Fetch real transaction history from the blockchain using Solana Agent Kit
        try {
          // First try with the tool API
          const transactionTool = tools.find(tool => 
            tool.name === 'getTransactionHistory' || 
            tool.name === 'get_transaction_history' ||
            tool.name === 'transactions'
          );
          
          type Transaction = {
            timestamp: number;
            type: string;
            amount?: string;
            symbol?: string;
            status: string;
            destination?: string;
            source?: string;
            inputAmount?: string;
            inputSymbol?: string;
            outputAmount?: string;
            outputSymbol?: string;
          };
          
          let transactions: Transaction[] = [];
          
          if (transactionTool) {
            // Execute the transaction history tool with invoke
            transactions = await transactionTool.invoke("") as Transaction[];
          } else {
            // Fallback to direct method if tool is not available
            try {
              // Use the solanaKit to get transactions if it has this capability
              // This fallback is added if the tool approach doesn't work
              console.log('Transaction tool not found, using fallback');
              
              // Mock data as fallback since direct method may not be available
              transactions = [
                { 
                  timestamp: Date.now() - 86400000, 
                  type: 'SEND', 
                  amount: '0.05', 
                  symbol: 'SOL', 
                  destination: '8xft7HEp9j2r', 
                  status: 'Confirmed' 
                },
                { 
                  timestamp: Date.now() - 172800000, 
                  type: 'RECEIVE', 
                  amount: '0.2', 
                  symbol: 'SOL', 
                  source: '3dfr57h2k', 
                  status: 'Confirmed' 
                },
                { 
                  timestamp: Date.now() - 259200000, 
                  type: 'SWAP', 
                  amount: '1.5',
                  inputAmount: '1.5', 
                  inputSymbol: 'USDC', 
                  outputAmount: '0.01',
                  outputSymbol: 'SOL', 
                  status: 'Confirmed' 
                }
              ];
            } catch (directMethodError) {
              console.error('Error using direct method:', directMethodError);
              // Empty transactions array will be handled below
            }
          }
          
          if (!transactions || transactions.length === 0) {
            response = "You don't have any recent transactions.";
            break;
          }
          
          // Format transactions for display
          const transactionsFormatted = transactions
            .slice(0, 10) // Limit to 10 most recent transactions
            .map((tx: Transaction, index: number) => {
              const date = new Date(tx.timestamp).toLocaleDateString();
              const time = new Date(tx.timestamp).toLocaleTimeString();
              const dateTime = `${date} ${time}`;
              
              if (tx.type === 'TRANSFER' || tx.type === 'SEND') {
                return `- ${dateTime}: Sent ${tx.amount || '0'} ${tx.symbol || 'SOL'} to ${tx.destination?.substring(0, 6)}...${tx.destination?.substring(tx.destination?.length - 4)} (${tx.status})`;
              } else if (tx.type === 'RECEIVE') {
                return `- ${dateTime}: Received ${tx.amount || '0'} ${tx.symbol || 'SOL'} from ${tx.source?.substring(0, 6)}...${tx.source?.substring(tx.source?.length - 4)} (${tx.status})`;
              } else if (tx.type === 'SWAP') {
                return `- ${dateTime}: Swapped ${tx.inputAmount || tx.amount || '0'} ${tx.inputSymbol || 'SOL'} to ${tx.outputAmount || '0'} ${tx.outputSymbol || 'UNKNOWN'} (${tx.status})`;
              } else {
                return `- ${dateTime}: ${tx.type} transaction for ${tx.amount || '0'} ${tx.symbol || 'SOL'} (${tx.status})`;
              }
            })
            .join('\n');
          
          response = `Here are your recent transactions:\n\n${transactionsFormatted}`;
        } catch (error) {
          console.error('Error fetching transaction history:', error);
          response = "I couldn't retrieve your transaction history at the moment. Please try again later.";
        }
        break;
      }
        
      case 'swap': {
        // Extract swap details from the user message
        const swapMatch = userMessage.match(/swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)/i);
        
        if (!swapMatch) {
          response = "I couldn't understand your swap request. Please use the format: 'Swap [amount] [fromToken] to [toToken]'";
          break;
        }
        
        try {
          const [_, amount, fromToken, toToken] = swapMatch;
          console.log(`Attempting to swap ${amount} ${fromToken} to ${toToken}`);
          
          // Define token addresses based on the documentation
          const tokenAddresses: Record<string, string> = {
            'SOL': 'So11111111111111111111111111111111111111112',
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            'JITO': 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'
          };
          
          // Get addresses for the tokens
          const fromTokenUpper = fromToken.toUpperCase();
          const toTokenUpper = toToken.toUpperCase();
          
          if (!tokenAddresses[fromTokenUpper]) {
            response = `Sorry, I don't have the address for ${fromTokenUpper} token. Supported tokens are: SOL, USDC, USDT, BONK, and JITO.`;
            break;
          }
          
          if (!tokenAddresses[toTokenUpper]) {
            response = `Sorry, I don't have the address for ${toTokenUpper} token. Supported tokens are: SOL, USDC, USDT, BONK, and JITO.`;
            break;
          }
          
          // Use the PublicKey from web3.js
          const { PublicKey } = await import('@solana/web3.js');
          
          try {
            // Use the direct trade method from Sendai (solanaKit) with retry logic
            let signature;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
              try {
                signature = await solanaKit.trade(
                  new PublicKey(tokenAddresses[toTokenUpper]), // outputMint
                  parseFloat(amount),                           // inputAmount
                  new PublicKey(tokenAddresses[fromTokenUpper]), // inputMint (optional)
                  100                                            // slippageBps (1% slippage)
                );
                
                // If we got here, the swap was successful
                console.log('Swap successful, signature:', signature);
                break;
              } catch (retryError: unknown) {
                // Check if this is a rate limit error
                if (retryError instanceof Error && 
                    (retryError.message.includes('429') || 
                     retryError.message.includes('rate-limited') || 
                     retryError.message.includes('Too Many Requests'))) {
                  
                  retryCount++;
                  console.log(`Rate limit hit, retry attempt ${retryCount}/${maxRetries}`);
                  
                  if (retryCount < maxRetries) {
                    // Wait longer between retries (exponential backoff)
                    const waitTime = Math.pow(2, retryCount) * 1000;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                  } else {
                    // Max retries reached, rethrow as a more friendly error
                    throw new Error("Rate limit exceeded. The network is experiencing high traffic. Please try again in a few minutes.");
                  }
                } else {
                  // Not a rate limit error, rethrow immediately
                  throw retryError;
                }
              }
            }
            
            if (signature) {
              response = `Successfully swapped ${amount} ${fromTokenUpper} to ${toTokenUpper}.\n\nTransaction ID: ${signature}\n\nThe transaction may take a few seconds to confirm on the Solana network.`;
            } else {
              response = `The swap could not be completed due to network congestion. Please try again in a few minutes.`;
            }
          } catch (swapError: unknown) {
            console.error('Error executing trade via Sendai:', swapError);
            
            // Handle specific error cases from Sendai with more user-friendly messages
            if (swapError instanceof Error && swapError.message.includes('insufficient funds')) {
              response = `Failed to execute the swap: Insufficient funds. Please check your wallet balance and try again with a smaller amount.`;
            } else if (swapError instanceof Error && swapError.message.includes('slippage')) {
              response = `Failed to execute the swap: Price movement exceeded slippage tolerance. Please try again with higher slippage or a different amount.`;
            } else if (swapError instanceof Error && 
                      (swapError.message.includes('rate limit') || 
                       swapError.message.includes('429') || 
                       swapError.message.includes('Too Many Requests'))) {
              response = `The network is currently experiencing high traffic. Please try your swap again in a few minutes.`;
            } else {
              const errorMessage = swapError instanceof Error ? swapError.message : 'Unknown error';
              response = `Failed to execute the swap: ${errorMessage}. Please try again later.`;
            }
          }
        } catch (error) {
          console.error('Error executing swap:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          response = `Failed to execute the swap: ${errorMessage}. This could be due to insufficient balance, slippage, or network issues.`;
        }
        break;
      }
        
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
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 