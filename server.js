require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON requests

// ✅ **POST /api/trades → Store Trade in DB**
app.post('/api/trades', async (req, res) => {
  try {
    const { userId, asset, quantity, price, tradeType } = req.body;

    if (!userId || !asset || !quantity || !price || !tradeType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const trade = await prisma.trade.create({
      data: { userId, asset, quantity, price, tradeType },
    });

    res.status(201).json({ message: 'Trade recorded successfully', trade });
  } catch (error) {
    console.error('❌ Error saving trade:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ **GET /api/trades → Fetch All Trades**
app.get('/api/trades', async (req, res) => {
  try {
    const trades = await prisma.trade.findMany();
    res.status(200).json(trades);
  } catch (error) {
    console.error('❌ Error fetching trades:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
