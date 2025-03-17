import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const trades = await prisma.trade.findMany();
    return NextResponse.json(trades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, asset, quantity, price, tradeType } = await req.json();

    if (!userId || !asset || !quantity || !price || !tradeType) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const trade = await prisma.trade.create({
      data: { userId, asset, quantity, price, tradeType },
    });

    return NextResponse.json({ message: 'Trade recorded successfully', trade }, { status: 201 });
  } catch (error) {
    console.error('Error saving trade:', error);
    return NextResponse.json({ error: 'Failed to save trade' }, { status: 500 });
  }
} 