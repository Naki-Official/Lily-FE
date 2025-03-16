'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { TokenIcon } from '@/components/ui/TokenIcon';

import { tokens } from '@/constant/tokens';

/**
 * Trade page component based on the Figma design
 * Shows trading interface with buy/sell options
 */
export default function TradePage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('trade');
  const [buyOrSell, setBuyOrSell] = React.useState('buy');

  // Get user's wallet address or use email as fallback
  const userDisplayName = React.useMemo(() => {
    if (!user) return '';

    // Check if user has linked wallets
    if (user.linkedAccounts && user.linkedAccounts.length > 0) {
      // Find the first wallet account
      const walletAccount = user.linkedAccounts.find(
        (account) =>
          account.type === 'wallet' || account.type === 'smart_wallet',
      );

      if (walletAccount && walletAccount.address) {
        // Shorten the wallet address for display (e.g., 0x1234...5678)
        const address = walletAccount.address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      }
    }

    // Fallback to email or default
    return user.email?.address || 'Anonymous User';
  }, [user]);

  // Redirect to auth page if not authenticated
  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/auth');
    }
  }, [ready, authenticated, router]);

  const handlePortfolioClick = () => {
    router.push('/dashboard/portfolio');
  };

  const handleHomeClick = () => {
    router.push('/home');
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    // In a real app, this would log the user out
  };

  if (!ready || !authenticated) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent'></div>
      </div>
    );
  }

  return (
    <main className='min-h-screen bg-[#F9F9F9]'>
      {/* Main content container */}
      <div className='mx-auto max-w-7xl px-6 py-8'>
        {/* Navigation */}
        <div className='mb-10 flex items-center justify-between'>
          <div className='flex items-center space-x-10'>
            <h1 className='font-sf-pro-rounded text-4xl font-bold tracking-tight text-[#162D3A]'>
              Lily
            </h1>
            <nav className='flex space-x-8'>
              <button
                className='font-sf-pro-rounded text-xl font-medium text-[#8A8A8E]'
                onClick={handleHomeClick}
              >
                Home
              </button>
              <button className='font-sf-pro-rounded text-xl font-medium text-[#162D3A]'>
                Trade
              </button>
            </nav>
          </div>

          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-3 rounded-full bg-white px-5 py-2.5 shadow-sm'>
              <div className='h-9 w-9 rounded-full bg-[#E5E5EA] flex items-center justify-center'>
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 20 20'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z'
                    fill='#8A8A8E'
                  />
                  <path
                    d='M10 11.5C5.8525 11.5 2.5 14.8525 2.5 19C2.5 19.5523 2.94772 20 3.5 20H16.5C17.0523 20 17.5 19.5523 17.5 19C17.5 14.8525 14.1475 11.5 10 11.5Z'
                    fill='#8A8A8E'
                  />
                </svg>
              </div>
              <span className='font-sf-pro text-base text-[#162D3A]'>
                {userDisplayName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center space-x-2 rounded-full px-5 py-2.5 text-[#FF3B30] hover:bg-red-50'
            >
              <span className='font-sf-pro text-base'>Log out</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Left column */}
          <div className='col-span-2 space-y-8'>
            <div className='flex items-center justify-between'>
              <h2 className='font-sf-pro-rounded text-2xl font-semibold text-[#162D3A]'>
                Lily's Trading Performance
              </h2>
              <button
                className='font-sf-pro-rounded text-lg font-medium text-[#007AFF]'
                onClick={handleDashboardClick}
              >
                Your Dashboard
              </button>
            </div>

            {/* Trading interface */}
            <div className='rounded-3xl bg-white p-8 shadow-sm'>
              <div className='mb-8 flex items-center justify-between'>
                <div className='flex space-x-1'>
                  <button
                    className={`rounded-full px-6 py-2.5 font-sf-pro text-base font-medium ${activeTab === 'trade' ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#8A8A8E]'}`}
                    onClick={() => setActiveTab('trade')}
                  >
                    Trade
                  </button>
                  <button
                    className={`rounded-full px-6 py-2.5 font-sf-pro text-base font-medium ${activeTab === 'alert' ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#8A8A8E]'}`}
                    onClick={() => setActiveTab('alert')}
                  >
                    Alert
                  </button>
                </div>
                <div className='flex space-x-1 rounded-full bg-[#F2F2F7] p-1'>
                  <button
                    className={`rounded-full px-6 py-2 font-sf-pro text-base font-medium ${buyOrSell === 'buy' ? 'bg-white text-[#162D3A] shadow-sm' : 'text-[#8A8A8E]'}`}
                    onClick={() => setBuyOrSell('buy')}
                  >
                    Buy
                  </button>
                  <button
                    className={`rounded-full px-6 py-2 font-sf-pro text-base font-medium ${buyOrSell === 'sell' ? 'bg-white text-[#162D3A] shadow-sm' : 'text-[#8A8A8E]'}`}
                    onClick={() => setBuyOrSell('sell')}
                  >
                    Sell
                  </button>
                </div>
              </div>

              {/* Trading form */}
              <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
                <div className='space-y-6'>
                  <div>
                    <label className='mb-2 block font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                      Select Token
                    </label>
                    <div className='relative'>
                      <select className='w-full appearance-none rounded-xl border border-[#E5E5EA] bg-[#F9F9F9] p-4 pr-10 font-sf-pro text-[#162D3A] focus:border-[#007AFF] focus:outline-none focus:ring-1 focus:ring-[#007AFF]'>
                        <option>BTC</option>
                        <option>ETH</option>
                        <option>SOL</option>
                        <option>DOGE</option>
                      </select>
                      <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-4'>
                        <svg
                          width='12'
                          height='8'
                          viewBox='0 0 12 8'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M1 1.5L6 6.5L11 1.5'
                            stroke='#8A8A8E'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className='mb-2 block font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                      Amount
                    </label>
                    <input
                      type='text'
                      className='w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9F9] p-4 font-sf-pro text-[#162D3A] focus:border-[#007AFF] focus:outline-none focus:ring-1 focus:ring-[#007AFF]'
                      placeholder='0.0'
                    />
                  </div>
                  <div>
                    <label className='mb-2 block font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                      Price (USD)
                    </label>
                    <input
                      type='text'
                      className='w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9F9] p-4 font-sf-pro text-[#8A8A8E] focus:outline-none'
                      placeholder='$36,750.00'
                      disabled
                    />
                  </div>
                </div>
                <div className='space-y-6'>
                  <div>
                    <label className='mb-2 block font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                      Total (USD)
                    </label>
                    <input
                      type='text'
                      className='w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9F9] p-4 font-sf-pro text-[#8A8A8E] focus:outline-none'
                      placeholder='$0.00'
                      disabled
                    />
                  </div>
                  <div className='pt-8'>
                    <button
                      className={`w-full rounded-xl p-4 text-center font-sf-pro text-base font-semibold text-white shadow-sm ${buyOrSell === 'buy' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}
                    >
                      {buyOrSell === 'buy' ? 'Buy BTC' : 'Sell BTC'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Market data */}
            <div className='rounded-3xl bg-white p-8 shadow-sm'>
              <h3 className='mb-6 font-sf-pro-rounded text-xl font-semibold text-[#162D3A]'>
                Market Data
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-[#E5E5EA]'>
                      <th className='pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                        Token
                      </th>
                      <th className='pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                        Price (USD)
                      </th>
                      <th className='pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                        24h Change
                      </th>
                      <th className='pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                        7d Change
                      </th>
                      <th className='pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                        Market Cap
                      </th>
                      <th className='pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        token: 'AI16Z',
                        price: '$36.75',
                        day: '+3.2%',
                        week: '+5.7%',
                        cap: '$715.8M',
                      },
                      {
                        token: 'KWEEN',
                        price: '$24.56',
                        day: '+2.1%',
                        week: '-1.3%',
                        cap: '$295.4M',
                      },
                      {
                        token: 'TNSR',
                        price: '$9.84',
                        day: '+4.5%',
                        week: '+12.8%',
                        cap: '$42.1M',
                      },
                      {
                        token: 'OPUS',
                        price: '$7.80',
                        day: '-1.2%',
                        week: '+8.5%',
                        cap: '$10.9M',
                      },
                      {
                        token: 'NAVAL',
                        price: '$15.20',
                        day: '+6.7%',
                        week: '+15.2%',
                        cap: '$8.3M',
                      },
                    ].map((item, index) => (
                      <tr key={index} className='border-b border-[#F2F2F7]'>
                        <td className='py-4'>
                          <div className='flex items-center space-x-3'>
                            <TokenIcon symbol={item.token} size={32} />
                            <span className='font-sf-pro font-medium text-[#162D3A]'>
                              {tokens[item.token].name}
                            </span>
                          </div>
                        </td>
                        <td className='py-4 font-sf-pro text-[#162D3A]'>
                          {item.price}
                        </td>
                        <td
                          className={`py-4 font-sf-pro ${item.day.startsWith('+') ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}
                        >
                          {item.day}
                        </td>
                        <td
                          className={`py-4 font-sf-pro ${item.week.startsWith('+') ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}
                        >
                          {item.week}
                        </td>
                        <td className='py-4 font-sf-pro text-[#162D3A]'>
                          {item.cap}
                        </td>
                        <td className='py-4'>
                          <button className='rounded-full bg-[#F2F2F7] px-4 py-2 font-sf-pro text-sm font-medium text-[#162D3A]'>
                            Trade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className='space-y-8'>
            {/* Lily's Recommendations */}
            <div className='rounded-3xl bg-white p-8 shadow-sm'>
              <div className='flex items-center space-x-3 mb-6'>
                <div className='h-12 w-12 rounded-full bg-[#007AFF] flex items-center justify-center'>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z'
                      fill='white'
                    />
                    <path
                      d='M8 12L11 15L16 9'
                      stroke='#007AFF'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <h3 className='font-sf-pro-rounded text-xl font-semibold text-[#162D3A]'>
                  Lily's Recommendations
                </h3>
              </div>

              <div className='space-y-4'>
                <div className='rounded-xl border border-[#E5E5EA] p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='h-10 w-10 rounded-full bg-[#F7931A] flex items-center justify-center'>
                      <span className='font-sf-pro text-sm font-bold text-white'>
                        BTC
                      </span>
                    </div>
                    <div>
                      <p className='font-sf-pro font-medium text-[#162D3A]'>
                        "Buy 0.05 BTC now"
                      </p>
                      <p className='font-sf-pro text-sm text-[#8A8A8E]'>
                        Price is expected to rise 5% in 24h
                      </p>
                    </div>
                  </div>
                </div>
                <div className='rounded-xl border border-[#E5E5EA] p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='h-10 w-10 rounded-full bg-[#627EEA] flex items-center justify-center'>
                      <span className='font-sf-pro text-sm font-bold text-white'>
                        ETH
                      </span>
                    </div>
                    <div>
                      <p className='font-sf-pro font-medium text-[#162D3A]'>
                        "Set alert if ETH &lt; $2,300"
                      </p>
                      <p className='font-sf-pro text-sm text-[#8A8A8E]'>
                        Good buying opportunity if price drops
                      </p>
                    </div>
                  </div>
                </div>
                <div className='rounded-xl border border-[#E5E5EA] p-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='h-10 w-10 rounded-full bg-[#00FFA3] flex items-center justify-center'>
                      <span className='font-sf-pro text-sm font-bold text-[#162D3A]'>
                        SOL
                      </span>
                    </div>
                    <div>
                      <p className='font-sf-pro font-medium text-[#162D3A]'>
                        "Hold SOL for now"
                      </p>
                      <p className='font-sf-pro text-sm text-[#8A8A8E]'>
                        Market is stabilizing after recent gains
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className='rounded-3xl bg-white p-8 shadow-sm'>
              <h3 className='mb-6 font-sf-pro-rounded text-xl font-semibold text-[#162D3A]'>
                Recent Activity
              </h3>

              <div className='space-y-6'>
                <div className='border-b border-[#F2F2F7] pb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='h-10 w-10 rounded-full bg-[#34C759] flex items-center justify-center'>
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 20 20'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667C5.39765 1.66667 1.66669 5.39763 1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333Z'
                            fill='white'
                          />
                          <path
                            d='M6.66669 10L8.33335 11.6667L13.3334 6.66667'
                            stroke='#34C759'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='font-sf-pro font-medium text-[#162D3A]'>
                          Bought 0.025 BTC
                        </p>
                        <p className='font-sf-pro text-sm text-[#8A8A8E]'>
                          $918.75 at $36,750.00
                        </p>
                      </div>
                    </div>
                    <span className='font-sf-pro text-sm text-[#8A8A8E]'>
                      12:09 PM
                    </span>
                  </div>
                  <p className='font-sf-pro text-sm text-[#8A8A8E] ml-12'>
                    Transaction completed successfully
                  </p>
                </div>

                <div className='border-b border-[#F2F2F7] pb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='h-10 w-10 rounded-full bg-[#FF9500] flex items-center justify-center'>
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 20 20'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667C5.39765 1.66667 1.66669 5.39763 1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333Z'
                            fill='white'
                          />
                          <path
                            d='M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z'
                            stroke='#FF9500'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='font-sf-pro font-medium text-[#162D3A]'>
                          Alert Set: ETH &lt; $2,300
                        </p>
                        <p className='font-sf-pro text-sm text-[#8A8A8E]'>
                          Current price: $2,456.78
                        </p>
                      </div>
                    </div>
                    <span className='font-sf-pro text-sm text-[#8A8A8E]'>
                      10:45 AM
                    </span>
                  </div>
                  <p className='font-sf-pro text-sm text-[#8A8A8E] ml-12'>
                    Alert will notify you when triggered
                  </p>
                </div>

                <div className='border-b border-[#F2F2F7] pb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='h-10 w-10 rounded-full bg-[#FF3B30] flex items-center justify-center'>
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 20 20'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M10 18.3333C14.6024 18.3333 18.3334 14.6024 18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667C5.39765 1.66667 1.66669 5.39763 1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333Z'
                            fill='white'
                          />
                          <path
                            d='M12.5 7.5L7.5 12.5M7.5 7.5L12.5 12.5'
                            stroke='#FF3B30'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='font-sf-pro font-medium text-[#162D3A]'>
                          Sold 0.5 SOL
                        </p>
                        <p className='font-sf-pro text-sm text-[#8A8A8E]'>
                          $49.23 at $98.45
                        </p>
                      </div>
                    </div>
                    <span className='font-sf-pro text-sm text-[#8A8A8E]'>
                      09:32 AM
                    </span>
                  </div>
                  <p className='font-sf-pro text-sm text-[#8A8A8E] ml-12'>
                    Transaction completed successfully
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
