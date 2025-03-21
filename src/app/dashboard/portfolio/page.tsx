'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { TokenIcon } from '@/components/ui/TokenIcon';

import { tokens } from '@/constant/tokens';

/**
 * Portfolio Management page component based on the Figma design
 * Shows portfolio value, holdings, and recommendations
 */
export default function PortfolioPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  // Get user's wallet address or use email as fallback
  const userDisplayName = React.useMemo(() => {
    if (!user) return '';
    
    // Check if user has linked wallets
    if (user.linkedAccounts && user.linkedAccounts.length > 0) {
      // Find the first wallet account
      const walletAccount = user.linkedAccounts.find(account => 
        account.type === 'wallet' || account.type === 'smart_wallet'
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

  const handleTradeClick = () => {
    router.push('/dashboard/trade');
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-custom-gradient">
      {/* Main content container */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Navigation */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <h1 className="font-sf-pro-rounded text-4xl font-bold tracking-tight text-white">
              Lily
            </h1>
            <nav className="flex space-x-8">
              <button 
                className="font-sf-pro-rounded text-xl font-medium text-white/80 hover:text-white transition-colors"
                onClick={handleHomeClick}
              >
                Home
              </button>
              <button 
                className="font-sf-pro-rounded text-xl font-medium text-white/80 hover:text-white transition-colors"
                onClick={handleTradeClick}
              >
                Trade
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 rounded-full bg-white/10 backdrop-blur-sm px-5 py-2.5 shadow-sm border border-white/20">
              <div className="h-9 w-9 rounded-full bg-custom-accent flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#312F32"/>
                  <path d="M10 11.5C5.8525 11.5 2.5 14.8525 2.5 19C2.5 19.5523 2.94772 20 3.5 20H16.5C17.0523 20 17.5 19.5523 17.5 19C17.5 14.8525 14.1475 11.5 10 11.5Z" fill="#312F32"/>
                </svg>
              </div>
              <span className="font-sf-pro text-base text-white">{userDisplayName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-full px-5 py-2.5 text-white bg-[rgba(255,59,48,0.2)] hover:bg-[rgba(255,59,48,0.3)] transition-colors border border-[rgba(255,59,48,0.3)]"
            >
              <span className="font-sf-pro text-base">Log out</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 
                className="font-sf-pro-rounded text-2xl font-semibold text-white cursor-pointer"
                onClick={handleDashboardClick}
              >
                Lily's Trading Performance
              </h2>
              <h2 className="font-sf-pro-rounded text-2xl font-semibold text-[#007AFF]">
                Your Portfolio Management
              </h2>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl bg-[#F9F9F9] p-6 shadow-sm">
                <h3 className="font-sf-pro-rounded text-lg font-semibold text-white">Total Value</h3>
                <p className="font-sf-pro-rounded text-2xl font-semibold text-white mt-2">3,500 SOL</p>
                <div className="mt-2 flex items-center text-sm text-[#34C759]">
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33334V12.6667M8 3.33334L4 7.33334M8 3.33334L12 7.33334" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>2.1% vs last week</span>
                </div>
              </div>
              <div className="rounded-xl bg-[#F9F9F9] p-6 shadow-sm">
                <h3 className="font-sf-pro-rounded text-lg font-semibold text-white">Stable Balance</h3>
                <p className="font-sf-pro-rounded text-2xl font-semibold text-white mt-2">500 USDC</p>
                <div className="mt-2 flex items-center text-sm text-[#34C759]">
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33334V12.6667M8 3.33334L4 7.33334M8 3.33334L12 7.33334" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>2.1% vs last week</span>
                </div>
              </div>
            </div>

            {/* My Portfolio */}
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-sf-pro-rounded text-xl font-semibold text-white">My Portfolio</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="relative w-64 h-64">
                  {/* Portfolio pie chart */}
                  <div className="absolute inset-0">
                    <svg width="100%" height="100%" viewBox="0 0 256 256">
                      <circle cx="128" cy="128" r="120" fill="none" stroke="#000000" strokeWidth="16" strokeDasharray="754" strokeDashoffset="0" opacity="0.4" />
                      <circle cx="128" cy="128" r="120" fill="none" stroke="#D9D9D9" strokeWidth="16" strokeDasharray="754" strokeDashoffset="452" />
                      <circle cx="128" cy="128" r="120" fill="none" stroke="#717A8C" strokeWidth="16" strokeDasharray="754" strokeDashoffset="528" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <TokenIcon symbol="SOL" size={32} />
                      </div>
                      <p className="font-sf-pro text-lg font-semibold">2000 SOL</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  {[
                    { token: 'AI16Z', amount: '30.244979', value: '2,000', change: '+3%' },
                    { token: 'KWEEN', amount: '650.5621', value: '1,000', change: '+2%' },
                    { token: 'TNSR', amount: '45.6789', value: '500', change: '+2%' },
                    { token: 'OPUS', amount: '78.9012', value: '500', change: '+2%' }
                  ].map((item, index) => {
                    const tokenData = tokens[item.token];
                    return (
                      <tr key={index} className="border-b border-[#CECECE]">
                        <td className="py-4 font-sf-pro text-sm font-medium text-[#292D32]">{tokenData.name}</td>
                        <td className="py-4 font-sf-pro text-sm text-[#292D32]">{item.amount}</td>
                        <td className="py-4 font-sf-pro text-sm text-[#292D32]">{item.value} SOL</td>
                        <td className="py-4 font-sf-pro text-sm text-[#149D52]">{item.change}</td>
                        <td className="py-4">
                          <div className="flex space-x-2">
                            <button className="rounded bg-[#59CD30] px-3 py-1 text-xs text-white">Buy</button>
                            <button className="rounded bg-[#FC0000] px-3 py-1 text-xs text-white">Sell</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Portfolio Value Over Time */}
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-sf-pro text-sm font-medium text-white">Portfolio Value Over Time</h3>
              <div className="h-64 w-full relative">
                {/* Chart grid lines */}
                <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-[#E2E7E7]"></div>
                <div className="absolute left-0 right-0 top-2/4 border-t border-dashed border-[#E2E7E7]"></div>
                <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-[#E2E7E7]"></div>
                <div className="absolute left-0 right-0 bottom-0 border-t border-[#E2E7E7]"></div>
                
                {/* Chart line */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 border-t-3 border-black"></div>
                
                {/* Month labels */}
                <div className="absolute bottom-[-24px] left-0 right-0 flex justify-between">
                  <span className="text-xs text-[#737B8B] opacity-50">01</span>
                  <span className="text-xs text-[#737B8B] opacity-50">02</span>
                  <span className="text-xs text-[#737B8B] opacity-50">03</span>
                  <span className="text-xs text-[#737B8B] opacity-50">04</span>
                  <span className="text-xs text-[#737B8B] opacity-50">05</span>
                  <span className="text-xs text-[#737B8B] opacity-50">06</span>
                </div>
              </div>
            </div>

            {/* Holdings */}
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-sf-pro text-sm font-medium text-white">Holdings</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#000000]">
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-white">Asset</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-white">Amount</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-white">Current Value</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-white">24H Change</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#CECECE]">
                      <td className="py-4 font-sf-pro text-sm font-medium text-white">BTC</td>
                      <td className="py-4 font-sf-pro text-sm text-white">0.4</td>
                      <td className="py-4 font-sf-pro text-sm text-white">2,000 SOL</td>
                      <td className="py-4 font-sf-pro text-sm text-white">+3%</td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button className="rounded bg-[#59CD30] px-3 py-1 text-xs text-white">Buy</button>
                          <button className="rounded bg-[#FC0000] px-3 py-1 text-xs text-white">Sell</button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-[#CECECE]">
                      <td className="py-4 font-sf-pro text-sm font-medium text-white">ETH</td>
                      <td className="py-4 font-sf-pro text-sm text-white">2.0</td>
                      <td className="py-4 font-sf-pro text-sm text-white">1,000 SOL</td>
                      <td className="py-4 font-sf-pro text-sm text-white">+2%</td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button className="rounded bg-[#59CD30] px-3 py-1 text-xs text-white">Buy</button>
                          <button className="rounded bg-[#FC0000] px-3 py-1 text-xs text-white">Sell</button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-[#CECECE]">
                      <td className="py-4 font-sf-pro text-sm font-medium text-white">SOL</td>
                      <td className="py-4 font-sf-pro text-sm text-white">500</td>
                      <td className="py-4 font-sf-pro text-sm text-white">500 SOL</td>
                      <td className="py-4 font-sf-pro text-sm text-white">+2%</td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button className="rounded bg-[#59CD30] px-3 py-1 text-xs text-white">Buy</button>
                          <button className="rounded bg-[#FC0000] px-3 py-1 text-xs text-white">Sell</button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-[#CECECE]">
                      <td className="py-4 font-sf-pro text-sm font-medium text-white">DOGE</td>
                      <td className="py-4 font-sf-pro text-sm text-white">10000</td>
                      <td className="py-4 font-sf-pro text-sm text-white">500 SOL</td>
                      <td className="py-4 font-sf-pro text-sm text-white">+2%</td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <button className="rounded bg-[#59CD30] px-3 py-1 text-xs text-white">Buy</button>
                          <button className="rounded bg-[#FC0000] px-3 py-1 text-xs text-white">Sell</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* Lily's Recommendations */}
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-4 font-sf-pro text-sm font-medium text-white">Lily's Recommendations</h3>
              <hr className="mb-6 border-[#DBE5EB] opacity-80" />
              
              <div className="space-y-6">
                <div className="border-b border-[#DBE5EB] pb-6 opacity-80">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-[#C4C4C4] shadow-lg flex items-center justify-center">
                      <span className="font-sf-pro text-sm font-bold text-white">BTC</span>
                    </div>
                    <p className="font-sf-pro text-sm font-medium text-[#273240]">"Buy 10% more BTC"</p>
                  </div>
                </div>
                <div className="border-b border-[#DBE5EB] pb-6 opacity-80">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-[#C4C4C4] shadow-lg flex items-center justify-center">
                      <span className="font-sf-pro text-sm font-bold text-white">ETH</span>
                    </div>
                    <p className="font-sf-pro text-sm font-medium text-[#273240]">"Set alert if ETH &lt; $1,500"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-4 font-sf-pro text-sm font-medium text-white">Recent Activity</h3>
              <hr className="mb-6 border-[#DBE5EB] opacity-80" />
              
              <div className="space-y-6">
                <div className="border-b border-[#DBE5EB] pb-6 opacity-80">
                  <div className="flex items-center justify-between">
                    <p className="font-sf-pro text-xs text-[#273240]">12:09:22</p>
                    <p className="font-sf-pro text-xs text-[#273240]">Nov 2nd, 2024</p>
                  </div>
                </div>
                <div className="border-b border-[#DBE5EB] pb-6 opacity-80">
                  <div className="flex items-center justify-between">
                    <p className="font-sf-pro text-xs text-[#273240]">12:09:22</p>
                    <p className="font-sf-pro text-xs text-[#273240]">Nov 2nd, 2024</p>
                  </div>
                </div>
                <div className="border-b border-[#DBE5EB] pb-6 opacity-80">
                  <div className="flex items-center justify-between">
                    <p className="font-sf-pro text-xs text-[#273240]">12:09:22</p>
                    <p className="font-sf-pro text-xs text-[#273240]">Nov 2nd, 2024</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade/Alert buttons */}
            <div className="flex space-x-4">
              <button 
                onClick={handleTradeClick}
                className="flex-1 rounded-md bg-[#000000] py-2 text-center font-sf-pro text-sm font-medium text-white"
              >
                Trade
              </button>
              <button className="flex-1 rounded-md bg-[#FA1C56] py-2 text-center font-sf-pro text-sm font-medium text-white">
                Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 