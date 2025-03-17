'use client';

import { TokenIcon } from '@/components/ui/TokenIcon';

export interface PortfolioCardProps {
  asset: string;
  quantity: number;
  avgPrice: number;
}

export function PortfolioCard({ asset, quantity, avgPrice }: PortfolioCardProps) {
  const value = quantity * avgPrice;
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <TokenIcon symbol={asset} size={32} />
        <div>
          <h3 className="font-medium">{asset}</h3>
          <p className="text-sm text-gray-500">{quantity.toFixed(6)} tokens</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-medium">${value.toFixed(2)}</p>
        <p className="text-sm text-gray-500">Avg: ${avgPrice.toFixed(2)}</p>
      </div>
    </div>
  );
} 