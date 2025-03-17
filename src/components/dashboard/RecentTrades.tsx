import { formatDistanceToNow } from 'date-fns';

import prisma from '@/lib/prisma';

// Define interface for trade data
interface Trade {
  id: string;
  userId: string;
  asset: string;
  quantity: number;
  price: number;
  tradeType: string;
  timestamp: Date;
}

export async function RecentTrades({ userId }: { userId: string }) {
  // Fetch recent trades from database
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 5,
  });
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
      
      {trades.length === 0 ? (
        <p className="text-gray-500">No trades recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {trades.map((trade: Trade) => (
            <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  trade.tradeType === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {trade.tradeType.toUpperCase()}
                </span>
                <h3 className="font-medium mt-1">{trade.asset}</h3>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-medium">{trade.quantity.toFixed(6)} tokens</p>
                <p className="text-sm text-gray-500">@ ${trade.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 