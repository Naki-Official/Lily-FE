import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, token, amount, price, type } = await req.json();

    const newTrade = await prisma.trade.create({
      data: {
        userId,
        token,
        amount,
        price,
        type,
      },
    });

    return NextResponse.json({ message: 'Trade saved successfully', trade: newTrade }, { status: 201 });
  } catch (error) {
    console.error('Error saving trade:', error);
    return NextResponse.json({ error: 'Failed to save trade' }, { status: 500 });
  }
}