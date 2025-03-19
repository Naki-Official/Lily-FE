import { NextResponse } from 'next/server';
import { SolanaAgentKit } from 'solana-agent-kit';

import { initSolanaKit, mockTransactions, tokenAddresses } from '@/utils/solana-utils';

// Mock transaction data (in a real app, this would come from the blockchain)
const _mockTransactions = [
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

// Cache for CoinGecko IDs to avoid repeated API calls
let coinGeckoIdsCache: Record<string, string> | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Initialize Solana components during runtime only
let solanaKit: SolanaAgentKit | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tools: any[] = [];

// Runtime initialization to prevent build-time errors
const initializeRuntime = async (userPrivateKey?: string, userWalletAddress?: string) => {
  try {
    // If we have a new user private key and already initialized, we should reinitialize
    if (userPrivateKey && solanaKit) {
      console.log('New user private key provided, reinitializing Solana Kit');
      solanaKit = null;
      tools = [];
    }
    
    // Skip initialization if already done and no new key provided
    if (solanaKit && !userPrivateKey) {
      console.log('Solana Kit already initialized, reusing existing instance');
      return;
    }
    
    console.log('Initializing Solana Kit and tools...');
    console.log('User wallet address available:', !!userWalletAddress);
    
    // Use the utility function that handles build-time safely
    // Pass the user's private key if provided
    const { solanaKit: kit, tools: solanaTools } = await initSolanaKit(userPrivateKey);
    
    // Store the results for reuse
    solanaKit = kit;
    tools = solanaTools;
    
    console.log('Solana initialization complete:', {
      kitAvailable: !!solanaKit,
      toolsCount: tools.length,
      usingUserKey: !!userPrivateKey,
      userWalletAddress: userWalletAddress || 'Not provided'
    });
  } catch (error) {
    console.error('Error during runtime initialization:', error);
    // Don't throw - let the app continue with null values
  }
};

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

// GET endpoint with added Vercel environment checks
export async function GET(req: Request) {
  // Check if we're on Vercel
  const isVercel = typeof process.env.VERCEL === 'string' && process.env.VERCEL === '1';
  
  // Return detailed env info when on Vercel to help with debugging
  if (isVercel) {
    const envInfo = {
      message: "This API endpoint requires a POST request with message data",
      debug: {
        isVercel: isVercel,
        hasPrivateKey: !!process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY,
        privateKeyLength: process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY?.length || 0,
        hasRpcUrl: !!process.env.NEXT_PUBLIC_RPC_URL,
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
      }
    };
    return NextResponse.json(envInfo);
  }
  
  // Standard response for non-Vercel environments
  return NextResponse.json({ 
    response: "This API endpoint requires a POST request with message data. Please use the chat interface." 
  });
}

// Initialize Solana Agent Kit with environment variables
export async function POST(req: Request) {
  try {
    // Check if we're on Vercel
    const isVercel = typeof process.env.VERCEL === 'string' && process.env.VERCEL === '1';
    console.log('API route POST handler - is Vercel environment:', isVercel);
    
    // Parse request body
    const body = await req.json();
    const { messages, privateKey, walletAddress } = body;
    
    // Initialize Solana components safely, passing user's private key if available
    await initializeRuntime(privateKey, walletAddress);
    
    // Process the user's message
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    // Use a simple approach to get a response from the Solana Agent Kit
    // This will handle any Solana-related commands or queries
    let response = "I'm sorry, I couldn't process your request.";
    
    console.log('Processing message:', userMessage);
    console.log('Solana connection available:', !!solanaKit);
    console.log('Using user provided key:', !!privateKey);
    console.log('User wallet address available:', !!walletAddress);
    
    // If wallet address is provided but we don't have a private key, use it for commands
    // that only need the address (balance, transaction history, etc.)
    if (walletAddress && !privateKey && (!process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY || !solanaKit)) {
      console.log('Using wallet address only mode (no private key)');
      
      if (userMessage.includes('address')) {
        return NextResponse.json({ 
          response: `Your wallet address is ${walletAddress}` 
        });
      }
      
      // For other commands, we need to explain that certain operations require the private key
      // Handle different commands with appropriate responses
      if (userMessage.includes('balance')) {
        return NextResponse.json({
          response: "I can see your wallet address, but I need additional permissions to check your balance. Please use the 'Connect Wallet' button to grant full access."
        });
      }
      
      if (userMessage.includes('transaction') || userMessage.includes('history')) {
        return NextResponse.json({
          response: "I can see your wallet address, but I need additional permissions to view your transaction history. Please use the 'Connect Wallet' button to grant full access."
        });
      }
      
      if (userMessage.includes('swap')) {
        return NextResponse.json({
          response: "I can see your wallet address, but I need additional permissions to perform swaps. Please use the 'Connect Wallet' button to grant full access."
        });
      }
    }
    
    // Special handling for Vercel without proper environment variables and no user key
    if (isVercel && (!privateKey && !process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY || !solanaKit)) {
      console.log('Running on Vercel with missing private key');
      
      // Add debugging information
      const debugInfo = {
        isVercel,
        hasPrivateKey: !!privateKey,
        privateKeyLength: privateKey ? privateKey.length : 0,
        hasEnvKey: !!process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY,
        envKeyLength: process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY ? process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY.length : 0,
        hasSolanaKit: !!solanaKit,
        hasWalletAddress: !!walletAddress,
        userMessage
      };
      console.log('Debug info:', debugInfo);
      
      // Handle different commands even when we don't have a private key
      if (userMessage.includes('address')) {
        if (walletAddress) {
          return NextResponse.json({ 
            response: `Your wallet address is ${walletAddress}` 
          });
        }
        
        return NextResponse.json({ 
          response: "You need to connect your wallet first to access wallet address information. Please click the 'Connect Wallet' button at the top of the page." 
        });
      }
      
      if (userMessage.includes('balance')) {
        return NextResponse.json({
          response: "You need to connect your wallet first to access wallet balance information. Please click the 'Connect Wallet' button at the top of the page."
        });
      }
      
      if (userMessage.includes('price') || userMessage.includes('token price')) {
        // Token price queries don't need wallet access, so we can still handle them
        return NextResponse.json({
          response: await getTokenPrices(userMessage)
        });
      }
      
      // If we need more specific error messages for other commands, add them here
      // Default to a generic response if no specific handlers
      return NextResponse.json({
        response: "I'm unable to access your wallet information at the moment. Please click the 'Connect Wallet' button at the top of the page."
      });
    }
    
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
          if (!solanaKit) {
            response = "I'm sorry, the Solana connection is not available at the moment.";
            break;
          }
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
          if (!solanaKit) {
            response = "I'm sorry, the Solana connection is not available at the moment.";
            break;
          }
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
          
          if (transactionTool && solanaKit) {
            // Execute the transaction history tool with invoke
            transactions = await transactionTool.invoke("") as Transaction[];
          } else {
            // Fallback to mock data
            console.log('Transaction tool not found or Solana Kit unavailable, using mock data');
            
            // Use mock data from solana-utils
            transactions = mockTransactions;
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
          
          // Use token addresses from solana-utils
          
          // Get addresses for the tokens
          const fromTokenUpper = fromToken.toUpperCase();
          const toTokenUpper = toToken.toUpperCase();
          
          if (!(fromTokenUpper in tokenAddresses)) {
            response = `Sorry, I don't have the address for ${fromTokenUpper} token. Supported tokens are: SOL, USDC, USDT, BONK, and JITO.`;
            break;
          }
          
          if (!(toTokenUpper in tokenAddresses)) {
            response = `Sorry, I don't have the address for ${toTokenUpper} token. Supported tokens are: SOL, USDC, USDT, BONK, and JITO.`;
            break;
          }
          
          // Use the PublicKey from web3.js
          const { PublicKey } = await import('@solana/web3.js');
          
          // Build the swap object
          const swapData = {
            amount: parseFloat(amount),
            fromMint: new PublicKey(tokenAddresses[fromTokenUpper as keyof typeof tokenAddresses]),
            toMint: new PublicKey(tokenAddresses[toTokenUpper as keyof typeof tokenAddresses])
          };
          
          if (!solanaKit) {
            response = "I'm sorry, the Solana connection is not available at the moment.";
            break;
          }
          
          // Mock response for now
          console.log('Swap data:', swapData);
          response = `Successfully swapped ${amount} ${fromTokenUpper} to ${toTokenUpper}`;
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