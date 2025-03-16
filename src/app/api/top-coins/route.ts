import { NextResponse } from 'next/server';

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

// Add mock data as a fallback
const mockTopCoins: TopCoin[] = [
  {
    finalScore: 2.459385116936292,
    token: {
      name: 'HYPE3',
      slug: 'hype3',
      ticker: 'COOL',
      creationDate: '2025-01-07T00:00:00Z',
      profileImageUrl:
        'https://pbs.twimg.com/profile_images/1881192998517833728/6rnBfkZk_normal.jpg',
      contractAddress: '9iQFnxrDDMFrhLx2pYJCDeqN3wFuaBimQkUnZQHNpump',
      marketCap: 540189.468666085,
      holdersCount: 5199,
      tokenPrice: 0.0005402166795,
      tokenPrice3DaysAgo: 0.0006882194058,
      tokenPriceChangePercent: -21.50516609277512,
      smartFollowersCount: 15,
      mindshare: 0.839021847151403,
      mindsharePrevious: 0.06229213957662418,
      mindshareDelta: 0.7767297075747789,
      mindshareDeltaPercent: 1246.9144788634862,
      volume24HoursDeltaPercent: 0,
      entryPrice: 0.000491382,
      takeProfit: 0.00081897,
      coinGeckoData: {
        symbol: 'COOL',
        name: 'HYPE3.cool',
        categories: [
          'Solana Ecosystem',
          'Meme',
          'Solana Meme',
          'AI Agents',
          'Pump.fun Ecosystem',
          'Made in China',
        ],
        twitter_acc: 'hype3dotcool',
        sentiment_votes_up: null,
        sentiment_votes_down: null,
        watchlist_users: 298,
        market_cap_rank: 4077,
        description:
          'HYPE3 is an IP agent framework built on the Solana blockchain that enables intellectual property creators to tokenize, manage, and monetize their digital assets.',
        current_price: 0.00054598,
        ath: 0.00940398,
        ath_change_percentage: -94.2567,
        atl: 0.00049131,
        atl_change_percentage: 9.93097,
        market_cap: 537207,
        total_volume: 93989,
        high_24h: 0.0005818,
        low_24h: 0.00049131,
        price_change_24h: 0.00003715,
        price_change_percentage_24h: 7.30162,
        price_change_percentage_7d: -47.73364,
        price_change_percentage_14d: -68.06753,
        price_change_percentage_30d: -79.15131,
        price_change_percentage_60d: -86.34804,
      },
    },
  },
  {
    finalScore: 1.8765432109876543,
    token: {
      name: 'Solana AI',
      slug: 'solana-ai',
      ticker: 'SAI',
      creationDate: '2024-05-15T00:00:00Z',
      profileImageUrl: 'https://example.com/sai.jpg',
      contractAddress: '8iQFnxrDDMFrhLx2pYJCDeqN3wFuaBimQkUnZQHNpump',
      marketCap: 1250000.5,
      holdersCount: 7500,
      tokenPrice: 0.00125,
      tokenPrice3DaysAgo: 0.00115,
      tokenPriceChangePercent: 8.7,
      smartFollowersCount: 25,
      mindshare: 0.75,
      mindsharePrevious: 0.45,
      mindshareDelta: 0.3,
      mindshareDeltaPercent: 66.67,
      volume24HoursDeltaPercent: 12.5,
      entryPrice: 0.00115,
      takeProfit: 0.00175,
      coinGeckoData: {
        symbol: 'SAI',
        name: 'Solana AI',
        categories: ['Solana Ecosystem', 'AI', 'Machine Learning'],
        twitter_acc: 'solanaai',
        sentiment_votes_up: 450,
        sentiment_votes_down: 50,
        watchlist_users: 1200,
        market_cap_rank: 2500,
        description:
          'Solana AI is a decentralized artificial intelligence platform built on Solana.',
        current_price: 0.00125,
        ath: 0.0025,
        ath_change_percentage: -50.0,
        atl: 0.00075,
        atl_change_percentage: 66.67,
        market_cap: 1250000,
        total_volume: 250000,
        high_24h: 0.0013,
        low_24h: 0.0012,
        price_change_24h: 0.00005,
        price_change_percentage_24h: 4.17,
        price_change_percentage_7d: 8.7,
        price_change_percentage_14d: 15.74,
        price_change_percentage_30d: 25.0,
        price_change_percentage_60d: 35.14,
      },
    },
  },
];

export async function GET() {
  try {
    // API endpoint for top coins - ensure URL is properly formatted
    const apiUrl = 'http://35.240.191.75:8000/api/top-agents';
    const apiKey = process.env.NEXT_PUBLIC_TOP_AGENTS_API_KEY;

    console.log('Fetching top coins from:', apiUrl);

    // Implement retry mechanism
    let retries = 3;
    let response;
    let lastError;

    while (retries > 0) {
      try {
        // Create headers object conditionally
        const headers: HeadersInit = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        };

        // Add API key to headers if it exists
        if (apiKey) {
          headers['x-api-key'] = apiKey;
        }

        // Fetch data from the external API
        response = await fetch(apiUrl, {
          method: 'GET',
          headers,
          cache: 'no-store', // Don't cache the response
        });

        if (response.ok) {
          break; // Success, exit the retry loop
        }

        // Get error details
        const errorText = await response
          .text()
          .catch(() => 'No error text available');
        lastError = `API error: ${response.status} ${response.statusText}. Body: ${errorText}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (fetchError) {
        lastError = `Fetch error: ${fetchError}`;
        console.error(`Retry ${4 - retries}/${3}: ${lastError}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      retries--;
    }

    if (!response || !response.ok) {
      console.error('All retries failed:', lastError);
      console.log('Falling back to mock data');
      return NextResponse.json(mockTopCoins, {
        status: 200,
        headers: { 'X-Data-Source': 'mock' },
      });
    }

    try {
      const data: TopCoin[] = await response.json();
      console.log(`Successfully fetched ${data.length} top coins`);

      // Return the data
      return NextResponse.json(data, {
        status: 200,
        headers: { 'X-Data-Source': 'api' },
      });
    } catch (jsonError) {
      console.error('Error parsing API response as JSON:', jsonError);

      // Try to get the raw response text for debugging
      const rawText = await response
        .text()
        .catch(() => 'Could not get response text');
      console.error('Raw response:', rawText);

      console.log('Falling back to mock data due to JSON parsing error');
      return NextResponse.json(mockTopCoins, {
        status: 200,
        headers: { 'X-Data-Source': 'mock' },
      });
    }
  } catch (error) {
    console.error('Error fetching top coins:', error);

    // Return mock data as a last resort
    console.log('Falling back to mock data due to exception');
    return NextResponse.json(mockTopCoins, {
      status: 200,
      headers: { 'X-Data-Source': 'mock' },
    });
  }
}
