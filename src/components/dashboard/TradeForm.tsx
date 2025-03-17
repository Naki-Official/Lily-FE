'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { addTrade } from '@/lib/actions/trades';

export function TradeForm() {
  const { user } = usePrivy();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;
    
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    formData.append('userId', user.id);
    formData.append('tradeType', tradeType);
    
    try {
      const result = await addTrade(formData);
      
      if (result.success) {
        // Reset form
        event.currentTarget.reset();
        // Refresh the page to show updated data
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting trade:', error);
      alert('Failed to submit trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Record New Trade</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md ${
              tradeType === 'buy' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setTradeType('buy')}
          >
            Buy
          </button>
          
          <button
            type="button"
            className={`flex-1 py-2 rounded-md ${
              tradeType === 'sell' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setTradeType('sell')}
          >
            Sell
          </button>
        </div>
        
        <div>
          <label htmlFor="asset" className="block text-sm font-medium text-gray-700">
            Asset
          </label>
          <input
            type="text"
            id="asset"
            name="asset"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            step="0.000001"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (USD)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            step="0.01"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Record Trade'}
        </button>
      </form>
    </div>
  );
} 