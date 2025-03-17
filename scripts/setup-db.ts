// This file can be run with ts-node scripts/setup-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up database...');
  
  try {
    // Perform any initial setup needed
    
    // Test connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Instead of SQL SHOW TABLES, check MongoDB collections by querying each model
    console.log('Checking database collections...');
    
    // Check User model
    const userCount = await prisma.user.count();
    console.log(`User collection exists with ${userCount} records`);
    
    // Check Conversation model
    const conversationCount = await prisma.conversation.count();
    console.log(`Conversation collection exists with ${conversationCount} records`);
    
    // Check Portfolio model
    const portfolioCount = await prisma.portfolio.count();
    console.log(`Portfolio collection exists with ${portfolioCount} records`);
    
    // Check Trade model
    const tradeCount = await prisma.trade.count();
    console.log(`Trade collection exists with ${tradeCount} records`);
    
    console.log('Database setup complete');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 