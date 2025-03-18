import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

// Create a new trade
export async function POST(req: NextRequest) {
  try {
    const { userId, asset, quantity, price, tradeType } = await req.json();

    const trade = await prisma.trade.create({
      data: { userId, asset, quantity, price, tradeType },
    });

    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Fetch all trades for a user
export async function GET(req: NextRequest) {
  try {
    // Extract userId from the URL path or search params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    const trades = await prisma.trade.findMany({ 
      where: { userId },
      orderBy: { timestamp: 'desc' } 
    });

    return NextResponse.json(trades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 