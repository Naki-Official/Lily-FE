import prisma from '@/lib/prisma';

import { PortfolioCard } from './PortfolioCard';

// Define interface for portfolio data
interface Portfolio {
  id: string;
  userId: string;
  asset: string;
  quantity: number;
  avgPrice: number;
}

export async function PortfolioWidget({ userId }: { userId: string }) {
  // Fetch portfolio data from database
  const portfolio = await prisma.portfolio.findMany({
    where: { userId },
  });
  
  // Calculate total portfolio value
  const totalValue = portfolio.reduce((sum: number, position: Portfolio) => {
    return sum + position.quantity * position.avgPrice;
  }, 0);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Portfolio</h2>
        <span className="text-lg font-medium">${totalValue.toFixed(2)}</span>
      </div>
      
      {portfolio.length === 0 ? (
        <p className="text-gray-500">No assets in your portfolio yet.</p>
      ) : (
        <div className="space-y-4">
          {portfolio.map((position: Portfolio) => (
            <PortfolioCard 
              key={position.id} 
              asset={position.asset}
              quantity={position.quantity}
              avgPrice={position.avgPrice}
            />
          ))}
        </div>
      )}
    </div>
  );
} 