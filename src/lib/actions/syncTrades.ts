'use server';

import prisma from '@/lib/prisma';

export async function syncTradesWithExpress() {
  try {
    const response = await fetch('http://localhost:YOUR_EXPRESS_PORT/api/trades', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch trades from Express');
    }
    
    const trades = await response.json();
    
    // Update local database with trades from Express
    for (const trade of trades) {
      await prisma.trade.upsert({
        where: { id: trade.id },
        update: trade,
        create: trade,
      });
    }
    
    return { success: true, count: trades.length };
  } catch (error) {
    console.error('Error syncing trades:', error);
    return { success: false, error: (error as Error).message };
  }
} 