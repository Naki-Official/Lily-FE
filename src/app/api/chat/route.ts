import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import bs58 from 'bs58';
import { NextResponse } from 'next/server';
import { createSolanaTools, SolanaAgentKit } from 'solana-agent-kit';

import { fetchTopRecommendedCoins, TopCoin } from '@/lib/api';
import prisma from '@/lib/prisma';

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

// Initialize Solana Agent Kit with proper configuration
// We create it outside the handler to reuse the same instance, but with error handling
let solanaKit: SolanaAgentKit | null = null;

try {
  const privateKeyBase58 = process.env.NEXT_PUBLIC_SOLANA_PRIVATE_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  
  if (privateKeyBase58 && rpcUrl) {
    // Validate the private key format
    try {
      const decodedPrivateKey = bs58.decode(privateKeyBase58);
      if (decodedPrivateKey.length !== 64) {
        console.warn('Invalid Solana private key length. It should be 64 bytes.');
      }
      
      // Create the Solana Agent Kit instance with all available API keys
      solanaKit = new SolanaAgentKit(
        privateKeyBase58,
        rpcUrl,
        {
          OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
          COINGECKO_DEMO_API_KEY: process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY,
        },
      );
      
      console.log('Solana Agent Kit initialized successfully');
    } catch (error) {
      console.error('Error initializing Solana Agent Kit:', error);
    }
  } else {
    console.warn('Missing Solana configuration. NEXT_PUBLIC_SOLANA_PRIVATE_KEY or NEXT_PUBLIC_RPC_URL not set.');
  }
} catch (error) {
  console.error('Error in Solana Agent Kit setup:', error);
}

// Create LangChain tools if SolanaAgentKit is available
const tools = solanaKit ? createSolanaTools(solanaKit) : [];

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

// Initialize Solana Agent Kit with environment variables
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages as Message[];
    
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid message format. Expected an array of messages.' },
        { status: 400 }
      );
    }
    
    // Extract user ID from request headers
    const userId = req.headers.get('x-user-id') || 'anonymous';

    // Try to save conversation to database, but don't let errors stop the main flow
    if (process.env.DATABASE_URL) {
      try {
        // Check if database connection is available - but wrap in a try/catch
        await prisma.$connect().catch((err: Error) => {
          console.warn('Failed to connect to database:', err.message);
        });
        
        // Only attempt to create a conversation if we have a valid Conversation model
        if (prisma.conversation) {
          await prisma.conversation.create({
            data: {
              userId,
              messages: JSON.stringify(messages),
              timestamp: new Date(),
            },
          }).catch((err: Error) => {
            console.warn('Failed to save conversation:', err.message);
          });
          
          console.log('Conversation saved to database');
        } else {
          console.warn('prisma.conversation is undefined. Make sure your Prisma schema is properly set up and the client has been generated.');
        }
      } catch (dbError) {
        console.error('Error in database operations:', dbError);
        // Continue execution even if database operations fail
      } finally {
        // Try to disconnect, but don't let errors stop the flow
        try {
          await prisma.$disconnect().catch(() => {});
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    } else {
      console.log('DATABASE_URL not set, skipping database operations');
    }

    // Pre-fetch top recommended coins for the AI to use in its responses
    // Use a try/catch to prevent errors from stopping the main flow
    let topCoins: TopCoin[] = [];
    try {
      topCoins = await getTopRecommendedCoins();
    } catch (error) {
      console.warn('Failed to fetch top coins:', error);
      // Continue with empty array
    }

    // Prepare the conversation for AI processing
    // The Vercel AI SDK expects messages to conform to specific format
    const aiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system message for Sendai agent
    const systemMessageContent = `You are Sendai, an expert AI assistant specializing in Solana blockchain and cryptocurrency trading. 
    Use your knowledge to provide helpful, accurate information about Solana, tokens, trading, and crypto markets.
    The user's portfolio data, trading history, and preferences are stored in the database and can be used to provide personalized advice.
    
    ${topCoins.length > 0 
      ? `Top Recommended Coins: ${topCoins.map(coin => 
          `${coin.token.name} (${coin.token.ticker}) - Score: ${coin.finalScore.toFixed(2)} - Price: $${coin.token.tokenPrice.toFixed(6)} - Change: ${coin.token.tokenPriceChangePercent.toFixed(2)}%`
        ).join(', ')}`
      : 'Top coin recommendations are currently being fetched from our analysis engine.'
    }
    
    Always be professional, concise, and focused on delivering value to the user.`;

    const systemMessage = {
      role: 'system' as const,
      content: systemMessageContent
    };

    // Use the streamText method for streaming responses
    try {
      const result = await streamText({
        model: openai('gpt-4-turbo'),
        messages: [systemMessage, ...aiMessages],
      });

      return result.toDataStreamResponse();
    } catch (streamError) {
      console.error('Error streaming response:', streamError);
      
      // Fallback to non-streaming response if streaming fails
      try {
        return NextResponse.json({
          id: 'fallback-response',
          role: 'assistant',
          content: 'I apologize, but I encountered an issue processing your request. Please try again in a moment.',
        });
      } catch (fallbackError) {
        console.error('Error in fallback response:', fallbackError);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}