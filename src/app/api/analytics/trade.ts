import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { userId, asset, quantity, price, tradeType } = req.body;

      // Save trade
      const newTrade = await prisma.trade.create({
        data: { userId, asset, quantity, price, tradeType },
      });

      // Update portfolio
      const existingAsset = await prisma.portfolio.findFirst({
        where: { userId, asset },
      });

      let newQuantity = tradeType === 'buy' 
        ? (existingAsset?.quantity ?? 0) + quantity
        : (existingAsset?.quantity ?? 0) - quantity;

      let newAvgPrice = tradeType === 'buy' 
        ? ((existingAsset?.avgPrice ?? 0) * (existingAsset?.quantity ?? 0) + price * quantity) / newQuantity
        : existingAsset?.avgPrice ?? 0;

      if (newQuantity <= 0) {
        await prisma.portfolio.delete({ where: { id: existingAsset?.id } });
      } else {
        await prisma.portfolio.upsert({
          where: { userId_asset: { userId, asset } },
          update: { quantity: newQuantity, avgPrice: newAvgPrice },
          create: { userId, asset, quantity: newQuantity, avgPrice: newAvgPrice },
        });
      }

      res.status(201).json(newTrade);
    } catch (error) {
      res.status(500).json({ error: 'Error saving trade' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
