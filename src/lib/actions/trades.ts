'use server';

import { revalidatePath } from 'next/cache';

import prisma from '@/lib/prisma';

// Add a new trade
export async function addTrade(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const asset = formData.get('asset') as string;
    const quantity = parseFloat(formData.get('quantity') as string);
    const price = parseFloat(formData.get('price') as string);
    const tradeType = formData.get('tradeType') as string;
    
    if (!userId || !asset || isNaN(quantity) || isNaN(price) || !tradeType) {
      return { success: false, error: 'All fields are required and must be valid' };
    }
    
    const trade = await prisma.trade.create({
      data: { userId, asset, quantity, price, tradeType },
    });
    
    // Update portfolio after adding trade
    await updatePortfolio(userId, asset, quantity, price, tradeType);
    
    // Revalidate dashboard page to show updated data
    revalidatePath('/dashboard');
    
    return { success: true, trade };
  } catch (error) {
    console.error('Error adding trade:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Update portfolio based on trade
async function updatePortfolio(
  userId: string, 
  asset: string, 
  quantity: number, 
  price: number,
  tradeType: string
) {
  // Find existing portfolio entry for this asset
  const portfolio = await prisma.portfolio.findFirst({
    where: { userId, asset },
  });
  
  if (portfolio) {
    // Update existing position
    if (tradeType === 'buy') {
      const newQuantity = portfolio.quantity + quantity;
      const newAvgPrice = ((portfolio.quantity * portfolio.avgPrice) + (quantity * price)) / newQuantity;
      
      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { quantity: newQuantity, avgPrice: newAvgPrice },
      });
    } else if (tradeType === 'sell') {
      const newQuantity = portfolio.quantity - quantity;
      
      if (newQuantity <= 0) {
        // Remove position if fully sold
        await prisma.portfolio.delete({
          where: { id: portfolio.id },
        });
      } else {
        // Keep same average price, just update quantity
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: { quantity: newQuantity },
        });
      }
    }
  } else if (tradeType === 'buy') {
    // Create new portfolio entry
    await prisma.portfolio.create({
      data: { userId, asset, quantity, avgPrice: price },
    });
  }
}

// Get user's trading history
export async function getUserTrades(userId: string) {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
    
    return { success: true, trades };
  } catch (error) {
    console.error('Error fetching trades:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Get user's portfolio
export async function getUserPortfolio(userId: string) {
  try {
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
    });
    
    return { success: true, portfolio };
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return { success: false, error: (error as Error).message };
  }
} 