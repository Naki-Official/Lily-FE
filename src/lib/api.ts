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

export interface TopCoin {
  finalScore: number;
  token: Token;
}

/**
 * Fetches top recommended coins from the API
 * @returns Promise<TopCoin[]> Array of top recommended coins
 */
export async function fetchTopRecommendedCoins(): Promise<TopCoin[]> {
  try {
    // Use our local API endpoint which has proper error handling and fallbacks
    const response = await fetch('/api/top-coins', {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache the response
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data as TopCoin[];
  } catch (error) {
    console.error('Error fetching top recommended coins:', error);
    // Return mock data for development purposes to prevent issues with Sendai agent
    return [
      {
        "finalScore": 2.459385116936292,
        "token": {
          "name": "HYPE3",
          "slug": "hype3",
          "ticker": "COOL",
          "creationDate": "2025-01-07T00:00:00Z",
          "profileImageUrl": "https://pbs.twimg.com/profile_images/1881192998517833728/6rnBfkZk_normal.jpg",
          "contractAddress": "9iQFnxrDDMFrhLx2pYJCDeqN3wFuaBimQkUnZQHNpump",
          "marketCap": 540189.468666085,
          "holdersCount": 5199,
          "tokenPrice": 0.0005402166795,
          "tokenPrice3DaysAgo": 0.0006882194058,
          "tokenPriceChangePercent": -21.50516609277512,
          "smartFollowersCount": 15,
          "mindshare": 0.839021847151403,
          "mindsharePrevious": 0.06229213957662418,
          "mindshareDelta": 0.7767297075747789,
          "mindshareDeltaPercent": 1246.9144788634862,
          "volume24HoursDeltaPercent": 0,
          "entryPrice": 0.000491382,
          "takeProfit": 0.00081897,
          "coinGeckoData": {
            "symbol": "COOL",
            "name": "HYPE3.cool",
            "categories": [
              "Solana Ecosystem",
              "Meme",
              "Solana Meme",
              "AI Agents",
              "Pump.fun Ecosystem",
              "Made in China"
            ],
            "twitter_acc": "hype3dotcool",
            "sentiment_votes_up": null,
            "sentiment_votes_down": null,
            "watchlist_users": 298,
            "market_cap_rank": 4077,
            "description": "HYPE3 is an IP agent framework built on the Solana blockchain that enables intellectual property creators to tokenize, manage, and monetize their digital assets.",
            "current_price": 0.00054598,
            "ath": 0.00940398,
            "ath_change_percentage": -94.2567,
            "atl": 0.00049131,
            "atl_change_percentage": 9.93097,
            "market_cap": 537207,
            "total_volume": 93989,
            "high_24h": 0.0005818,
            "low_24h": 0.00049131,
            "price_change_24h": 0.00003715,
            "price_change_percentage_24h": 7.30162,
            "price_change_percentage_7d": -47.73364,
            "price_change_percentage_14d": -68.06753,
            "price_change_percentage_30d": -79.15131,
            "price_change_percentage_60d": -86.34804
          }
        }
      }
    ];
  }
}

/**
 * Fetches detailed information about a specific coin
 * @param ticker The ticker symbol of the coin (e.g., "SOL")
 * @returns Promise<Token | null> The coin information or null if not found
 */
export async function fetchCoinDetails(ticker: string): Promise<Token | null> {
  const topCoins = await fetchTopRecommendedCoins();
  return topCoins.find(coin => coin.token.ticker.toUpperCase() === ticker.toUpperCase())?.token || null;
} 