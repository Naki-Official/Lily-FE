import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Create a new trade
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, asset, quantity, price, tradeType } = req.body;

    const trade = await prisma.trade.create({
      data: { userId, asset, quantity, price, tradeType },
    });

    res.status(201).json(trade);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Fetch all trades for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const trades = await prisma.trade.findMany({ where: { userId } });

    res.status(200).json(trades);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Export the router correctly for ES modules
export default router;
