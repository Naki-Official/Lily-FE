import { NextResponse } from 'next/server';

// Simple endpoint to check if all required environment variables are set
export async function GET() {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  // Add cache headers to prevent frequent requests
  return NextResponse.json({ 
    isConfigured: !!privateKey && !!rpcUrl && !!openaiApiKey,
    missingVars: {
      privateKey: !privateKey,
      rpcUrl: !rpcUrl,
      openaiApiKey: !openaiApiKey
    }
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    }
  });
} 