import { NextResponse } from 'next/server';

// CoinGecko IDs for popular tokens
const coinGeckoIds: Record<string, string> = {
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'BONK': 'bonk',
  'JTO': 'jito-governance-token',
  'PYTH': 'pyth-network',
  'WIF': 'dogwifcoin',
  'JUP': 'jupiter',
  'MEME': 'meme-protocol',
  'SONIC': 'sonic',
  'NEON': 'neon',
  'RAY': 'raydium',
  'ORCA': 'orca',
  'COPE': 'cope',
  'MNGO': 'mango-markets',
  'SAMO': 'samoyedcoin',
};

// Cache the result for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let tokensCache: Record<string, { price: number; change: number }> | null = null;
let lastCacheUpdate = 0;

export async function GET() {
  try {
    const now = Date.now();
    
    // Check if cache is valid
    if (tokensCache && now - lastCacheUpdate < CACHE_DURATION) {
      console.log('Returning cached token prices');
      return NextResponse.json({
        prices: tokensCache,
        success: true,
        cached: true,
        updatedAt: new Date(lastCacheUpdate).toISOString()
      });
    }
    
    // First, check if CoinGecko API is available
    try {
      const pingUrl = 'https://api.coingecko.com/api/v3/ping';
      const pingResponse = await fetch(pingUrl);
      if (!pingResponse.ok) {
        console.error('CoinGecko API ping failed:', pingResponse.status, pingResponse.statusText);
        return NextResponse.json({
          prices: getFallbackTokenPrices(),
          success: false,
          error: 'CoinGecko API not available',
          cached: false
        }, { status: 503 });
      }
      console.log('CoinGecko API ping successful');
    } catch (pingError) {
      console.error('Error pinging CoinGecko API:', pingError);
      return NextResponse.json({
        prices: getFallbackTokenPrices(),
        success: false,
        error: 'Error pinging CoinGecko API',
        cached: false
      }, { status: 503 });
    }
    
    // Get popular token IDs
    const popularTokensIds = Object.values(coinGeckoIds).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${popularTokensIds}&vs_currencies=usd&include_24hr_change=true`;
    
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
          },
          next: { revalidate: 300 } // Cache for 5 minutes on the Vercel edge
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
      return NextResponse.json({
        prices: getFallbackTokenPrices(),
        success: false,
        error: lastError,
        cached: false
      }, { status: 503 });
    }
    
    const data = await response.json();
    console.log('CoinGecko API response:', JSON.stringify(data));
    
    // Format the price data
    const result: Record<string, { price: number; change: number }> = {};
    
    // Map the results back to token symbols
    for (const [symbol, id] of Object.entries(coinGeckoIds)) {
      if (data[id] && data[id].usd) {
        result[symbol] = {
          price: data[id].usd || 0,
          change: data[id].usd_24h_change || 0
        };
        console.log(`Successfully mapped ${symbol} price:`, result[symbol]);
      } else {
        console.error(`Failed to get price data for ${symbol} (ID: ${id})`);
      }
    }
    
    // Update cache
    tokensCache = result;
    lastCacheUpdate = now;
    
    return NextResponse.json({
      prices: result,
      success: true,
      cached: false,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching token prices from CoinGecko:', error);
    return NextResponse.json({
      prices: getFallbackTokenPrices(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false
    }, { status: 500 });
  }
}

// Also support POST method for backward compatibility
export async function POST() {
  return GET();
}

// Fallback token prices when API fails
function getFallbackTokenPrices() {
  return {
    'SOL': { price: 126.33, change: 0.95 },
    'USDC': { price: 0.999, change: 0.0 },
    'BONK': { price: 0.00001077, change: 0.50 },
    'JTO': { price: 2.14, change: -1.95 },
    'PYTH': { price: 0.15, change: -0.58 },
    'WIF': { price: 0.47, change: 1.38 }
  };
} 