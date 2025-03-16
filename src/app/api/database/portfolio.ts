import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { Request, Response } from 'express';


export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: userId },
    });

    res.json(portfolio || { holdings: {} });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
