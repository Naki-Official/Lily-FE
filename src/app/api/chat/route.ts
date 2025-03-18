import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createSolanaTools, SolanaAgentKit } from 'solana-agent-kit';

import { fetchTopRecommendedCoins, TopCoin } from '@/lib/api';

// Export config for API route
export const maxDuration = 60; // Increase timeout for Sendai operations

// Initialize Solana Agent Kit with the provided private key and RPC URL
function initSolanaAgentKit(privateKey: string, rpcUrl: string): SolanaAgentKit {
  try {
    console.log('Initializing Solana Agent Kit with provided credentials');
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('Missing OpenAI API key');
    }
    
    return new SolanaAgentKit(
      privateKey,
      rpcUrl,
      openaiApiKey
    );
  } catch (error) {
    console.error('Failed to initialize Solana Agent Kit:', error);
    throw new Error(`Failed to initialize Solana Agent Kit: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Mock transaction data (in a real app, this would come from the blockchain)
const mockTransactions = [
  {
    id: 'tx1',
    type: 'Send',
    amount: '0.05',
    token: 'SOL',
    to: '8xft7...9j2r',
    date: '2023-06-15',
    status: 'Confirmed',
  },
  {
    id: 'tx2',
    type: 'Receive',
    amount: '0.2',
    token: 'SOL',
    from: '3dfr5...7h2k',
    date: '2023-06-14',
    status: 'Confirmed',
  },
  {
    id: 'tx3',
    type: 'Swap',
    amount: '1.5',
    token: 'USDC',
    to: '0.01 SOL',
    date: '2023-06-12',
    status: 'Confirmed',
  },
];

// CoinGecko token ID mapping
const coinGeckoIds: Record<string, string> = {
  SOL: 'solana',
  USDC: 'usd-coin',
  BONK: 'bonk',
  JTO: 'jito-network',
  PYTH: 'pyth-network',
  WIF: 'wif-network',
  SONIC: 'sonic-token',
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

interface TokenPriceData {
  price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

// Define the message interface based on Vercel AI SDK requirements
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
}

// Function to fetch all coins from CoinGecko API
async function fetchCoinGeckoIds() {
  try {
    // First, check if CoinGecko API is available
    try {
      const pingUrl = 'https://api.coingecko.com/api/v3/ping';
      const pingResponse = await fetch(pingUrl);
      if (!pingResponse.ok) {
        console.error(
          'CoinGecko API ping failed:',
          pingResponse.status,
          pingResponse.statusText,
        );
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
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          break; // Success, exit the retry loop
        }

        lastError = `CoinGecko API error: ${response.status} ${response.statusText}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);

        // If rate limited (429), wait longer before retrying
        if (response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (fetchError) {
        lastError = `Fetch error: ${fetchError}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
    const popularCoins = [
      'solana',
      'usd-coin',
      'bonk',
      'jito-network',
      'pyth-network',
      'wif-network',
      'sonic-token',
    ];

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

// Helper function to get token prices from CoinGecko API
async function getTokenPrices(tokenSymbols: string[]): Promise<Record<string, TokenPriceData> | null> {
  try {
    // Get or refresh the CoinGecko IDs cache
    const now = Date.now();
    if (!coinGeckoIdsCache || now - lastCacheTime > CACHE_DURATION) {
      const fetchedIds = await fetchCoinGeckoIds();
      if (fetchedIds) {
        coinGeckoIdsCache = fetchedIds;
        lastCacheTime = now;
      }
    }

    // If we don't have a valid cache, use the default mapping
    const idsMapping = coinGeckoIdsCache || coinGeckoIds;

    // Get the CoinGecko IDs for the requested tokens
    const tokenIds = tokenSymbols
      .map((symbol) => {
        const uppercaseSymbol = symbol.toUpperCase();
        const id = idsMapping[uppercaseSymbol];
        if (!id) {
          console.warn(`No CoinGecko ID found for token: ${symbol}`);
        }
        return id;
      })
      .filter(Boolean); // Remove any undefined values

    if (tokenIds.length === 0) {
      console.warn('No valid CoinGecko IDs found for the requested tokens');
      return null;
    }

    // Fetch the current prices for the tokens
    const ids = tokenIds.join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    console.log('Fetching token prices from URL:', url);

    // Implement retry mechanism
    let retries = 3;
    let response;
    let lastError;

    while (retries > 0) {
      try {
        response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          break; // Success, exit the retry loop
        }

        lastError = `CoinGecko API error: ${response.status} ${response.statusText}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);

        // If rate limited (429), wait longer before retrying
        if (response.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (fetchError) {
        lastError = `Fetch error: ${fetchError}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      retries--;
    }

    if (!response || !response.ok) {
      console.error('All retries failed:', lastError);
      return null;
    }

    const pricesData = await response.json();
    console.log(`Fetched prices for ${pricesData.length} tokens from CoinGecko`);

    // Create a mapping of token symbol to price data
    const pricesMapping: Record<string, TokenPriceData> = {};

    for (const data of pricesData) {
      // Find the original symbol by looking up the ID in our idsMapping
      const originalSymbol = Object.keys(idsMapping).find(
        (key) => idsMapping[key] === data.id,
      );

      if (originalSymbol) {
        pricesMapping[originalSymbol] = {
          price: data.current_price,
          price_change_percentage_24h: data.price_change_percentage_24h,
          market_cap: data.market_cap,
          total_volume: data.total_volume,
          high_24h: data.high_24h,
          low_24h: data.low_24h,
        };
      }
    }

    return pricesMapping;
  } catch (error) {
    console.error('Error fetching token prices from CoinGecko:', error);
    return null;
  }
}

// Cache for top recommended coins
let topCoinsCache: TopCoin[] | null = null;
let topCoinsLastFetchTime = 0;
const TOP_COINS_CACHE_DURATION = 1800000; // 30 minutes in milliseconds

// Fetch top recommended coins with caching
async function getTopRecommendedCoins(): Promise<TopCoin[]> {
  const now = Date.now();
  
  // Refresh cache if needed
  if (!topCoinsCache || now - topCoinsLastFetchTime > TOP_COINS_CACHE_DURATION) {
    try {
      const coins = await fetchTopRecommendedCoins();
      if (coins && coins.length > 0) {
        topCoinsCache = coins;
        topCoinsLastFetchTime = now;
        console.log(`Fetched ${coins.length} top recommended coins`);
      }
    } catch (error) {
      console.error('Error fetching top recommended coins:', error);
    }
  }
  
  return topCoinsCache || [];
}

// Update the POST handler to utilize Sendai for blockchain operations
export async function POST(req: Request) {
  try {
    console.log('Chat API called');
    
    // Add response cache headers to prevent retries
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    };
    
    // Extract request information
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          role: 'assistant',
          content: "I need a message to respond to. Please try again with a question.",
          id: `error-${Date.now()}`
        }),
        { status: 200, headers }
      );
    }
    
    // Get user ID from headers for personalization
    const reqHeaders = new Headers(req.headers);
    const userId = reqHeaders.get('x-user-id') || 'anonymous';
    console.log('Request for user:', userId);
    
    // Get Solana configuration from environment variables
    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    // Handle missing configuration with clear error message
    if (!privateKey || !rpcUrl || !openaiApiKey) {
      console.warn('Missing required configuration:', {
        hasPrivateKey: !!privateKey,
        hasRpcUrl: !!rpcUrl,
        hasOpenAIKey: !!openaiApiKey
      });
      
      // Return a graceful error response instead of throwing
      return new Response(
        JSON.stringify({ 
          role: 'assistant',
          content: "I'm sorry, but I can't connect to the Solana network right now due to missing configuration. Please try again later.",
          id: `error-${Date.now()}`
        }),
        { status: 200, headers }
      );
    }
    
    // Attempt to initialize Solana kit with proper error handling
    let solanaKit;
    try {
      console.log('Initializing Solana Agent Kit');
      solanaKit = initSolanaAgentKit(privateKey, rpcUrl);
    } catch (error) {
      console.error('Failed to initialize Solana Agent Kit:', error);
      
      // Return a graceful error response
      return new Response(
        JSON.stringify({ 
          role: 'assistant',
          content: "I'm sorry, but I couldn't initialize the Solana tools. Please try again later.",
          id: `error-${Date.now()}`
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Proceed with the rest of the code only if initialization succeeded
    // Create and prepare Solana tools for the AI
    const solanaTools = createSolanaTools(solanaKit);
    
    // Convert tools array to an object format that Vercel AI SDK expects
    const toolsObj = {};
    solanaTools.forEach(tool => {
      if (tool && tool.name && typeof tool.invoke === 'function') {
        // @ts-expect-error - We know this is the correct format for Vercel AI SDK
        toolsObj[tool.name] = async (...args) => {
          try {
            // @ts-expect-error - We know this is the correct format for tool invocation
            return await tool.invoke(...args);
          } catch (toolError: unknown) {
            const errorMessage = toolError instanceof Error ? toolError.message : String(toolError);
            console.error(`Error invoking tool ${tool.name}:`, toolError);
            return `Error executing ${tool.name}: ${errorMessage}`;
          }
        };
      }
    });
    
    // Pre-fetch top recommended coins for the AI to use
    let topCoins: TopCoin[] = [];
    try {
      console.log('Fetching top recommended coins');
      topCoins = await getTopRecommendedCoins();
    } catch (error) {
      console.warn('Failed to fetch top coins:', error);
      // Continue with empty array
    }

    // Prepare the AIMessages with user query
    const aiMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system message for Sendai agent
    const systemMessageContent = `You are Lily, an expert AI assistant specializing in Solana blockchain and cryptocurrency trading,
    powered by Sendai. You can interact with the Solana blockchain to perform various operations.

    Your capabilities include:
    - Checking wallet balances
    - Viewing wallet addresses
    - Getting token prices
    - Trading and swapping tokens 
    - Viewing transaction history
    - Providing personalized investment advice

    ${topCoins.length > 0 
      ? `Top Recommended Coins: ${topCoins.map(coin => 
          `${coin.token.name} (${coin.token.ticker}) - Score: ${coin.finalScore.toFixed(2)} - Price: $${coin.token.tokenPrice.toFixed(6)} - Change: ${coin.token.tokenPriceChangePercent.toFixed(2)}%`
        ).join(', ')}`
      : 'Top coin recommendations are currently being fetched from our analysis engine.'
    }

    When the user asks about blockchain operations, use your available tools to perform them.
    Always be professional, concise, and focused on delivering value to the user.`;

    const systemMessage = {
      role: 'system' as const,
      content: systemMessageContent
    };

    console.log('Streaming response with available tools');
    
    // Stream the text response using Vercel AI SDK and Sendai
    const text = await streamText({
      model: openai('gpt-4o'),
      system: systemMessage.content,
      messages: aiMessages,
      tools: toolsObj,
      temperature: 0.7,
      maxTokens: 500,
    });
    
    // Add headers to prevent caching and infinite retries
    const response = text.toDataStreamResponse();
    
    // Add cache control headers to prevent infinite loops
    response.headers.set('Cache-Control', 'no-store, private, max-age=0');
    response.headers.set('X-Session-Id', `${Date.now()}`);
    
    return response;
  } catch (error: unknown) {
    console.error('Error in chat route:', error);
    
    // Construct a response that won't cause an infinite retry loop
    return new Response(
      JSON.stringify({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again later."
      }),
      {
        status: 200, // Return 200 to prevent retries
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private, max-age=0'
        }
      }
    );
  }
}