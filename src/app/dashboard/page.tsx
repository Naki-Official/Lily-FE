'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { TokenIcon } from '@/components/ui/TokenIcon';

import { tokens } from '@/constant/tokens';

/**
 * Dashboard page component based on the Figma design
 * Shows trading performance, portfolio management, and token information
 */
export default function DashboardPage() {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();
  const [_isLoggingOut, setIsLoggingOut] = React.useState(false);

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

  const handlePortfolioClick = () => {
    router.push('/dashboard/portfolio');
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/auth');
      // eslint-disable-next-line no-console
      console.log('User logged out');
    } catch (error) {
      // Handle logout error
    } finally {
      setIsLoggingOut(false);
    }
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
              <h2 className="font-sf-pro-rounded text-2xl font-semibold text-[#162D3A]">
                Lily's Trading Performance
              </h2>
              <button 
                className="font-sf-pro-rounded text-lg font-medium text-[#007AFF]"
                onClick={handlePortfolioClick}
              >
                Your Portfolio Management
              </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="font-sf-pro-rounded text-lg font-medium text-[#8A8A8E]">Total Tokens</h3>
                <p className="font-sf-pro-rounded text-3xl font-semibold text-[#162D3A] mt-2">16</p>
                <div className="mt-2 flex items-center text-sm text-[#34C759]">
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33334V12.6667M8 3.33334L4 7.33334M8 3.33334L12 7.33334" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>2.1% vs last week</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="font-sf-pro-rounded text-lg font-medium text-[#8A8A8E]">Total USD Spent</h3>
                <p className="font-sf-pro-rounded text-3xl font-semibold text-[#162D3A] mt-2">$4,049.00</p>
                <div className="mt-2 flex items-center text-sm text-[#34C759]">
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33334V12.6667M8 3.33334L4 7.33334M8 3.33334L12 7.33334" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>2.1% vs last week</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="font-sf-pro-rounded text-lg font-medium text-[#8A8A8E]">Total Profit/Loss</h3>
                <p className="font-sf-pro-rounded text-3xl font-semibold text-[#34C759] mt-2">+$823.74</p>
                <div className="mt-2 flex items-center text-sm text-[#34C759]">
                  <svg className="mr-1" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33334V12.6667M8 3.33334L4 7.33334M8 3.33334L12 7.33334" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>2.1% vs last week</span>
                </div>
              </div>
            </div>

            {/* Token list */}
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-sf-pro-rounded text-xl font-semibold text-[#162D3A]">All Tokens</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E5EA]">
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E] w-[200px]">Token</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E] w-[300px]">Address</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Total Received</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Total Spent (USD)</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Current Value (USD)</th>
                      <th className="pb-4 text-center font-sf-pro text-sm font-medium text-[#8A8A8E]">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { token: 'AI16Z', received: '30.244979', spent: '$491.40', value: '$688.68', profit: '+40.1%', isProfit: true },
                      { token: 'KWEEN', received: '650.5621', spent: '$446.80', value: '$585.25', profit: '+31.0%', isProfit: true },
                      { token: 'TNSR', received: '45.6789', spent: '$230.50', value: '$310.25', profit: '+34.6%', isProfit: true },
                      { token: 'OPUS', received: '78.9012', spent: '$400.00', value: '$356.00', profit: '-11.0%', isProfit: false },
                      { token: 'NAVAL', received: '92.3456', spent: '$320.50', value: '$380.25', profit: '+18.6%', isProfit: true }
                    ].map((item, index) => {
                      const tokenData = tokens[item.token];
                      return (
                        <tr key={index} className="border-b border-[#F2F2F7]">
                          <td className="py-4 pr-8">
                            <div className="flex items-center space-x-3">
                              <TokenIcon symbol={item.token} size={32} />
                              <span className="font-sf-pro font-medium text-[#162D3A]">{tokenData.name}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-8 font-sf-pro text-sm text-[#8A8A8E]">{tokenData.address}</td>
                          <td className="py-4 pr-8 font-sf-pro text-[#162D3A]">{item.received}</td>
                          <td className="py-4 pr-8 font-sf-pro text-[#162D3A]">{item.spent}</td>
                          <td className="py-4 pr-8 font-sf-pro text-[#162D3A]">{item.value}</td>
                          <td className="py-4 text-center">
                            <span className={`font-sf-pro font-medium ${item.isProfit ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>{item.profit}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="font-sf-pro-rounded text-lg font-medium text-[#8A8A8E]">Overall Profit</h3>
              <p className="font-sf-pro-rounded text-3xl font-semibold text-[#34C759] mt-2">+20.4%</p>
              <div className="mt-2 flex items-center text-sm text-[#34C759]">
                <svg className="mr-1" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3.33334V12.6667M8 3.33334L4 7.33334M8 3.33334L12 7.33334" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>2.1% vs last week</span>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-sf-pro-rounded text-xl font-semibold text-[#162D3A]">Portfolio Overview</h3>
              
              {/* Token list */}
              <div className="space-y-4">
                {[
                  { token: 'AI16Z', percentage: '25%' },
                  { token: 'KWEEN', percentage: '20%' },
                  { token: 'TNSR', percentage: '15%' },
                  { token: 'OPUS', percentage: '15%' },
                  { token: 'NAVAL', percentage: '10%' },
                  { token: 'JARVIS', percentage: '8%' },
                  { token: 'WAIFU', percentage: '7%' }
                ].map((item, index) => {
                  const tokenData = tokens[item.token];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TokenIcon symbol={item.token} size={32} />
                        <span className="font-sf-pro text-sm text-[#121212]">{tokenData.name}</span>
                      </div>
                      <span className="font-sf-pro text-sm text-[#8A8A8E]">{item.percentage}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-[#007AFF] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white"/>
                    <path d="M8 12L11 15L16 9" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-sf-pro-rounded text-xl font-semibold text-[#162D3A]">Lily's Advice</h3>
              </div>
              
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E5E5EA] p-4">
                  <div className="flex items-center space-x-3">
                    <TokenIcon symbol="BTC" size={40} />
                    <div>
                      <p className="font-sf-pro font-medium text-[#162D3A]">"Consider diversifying your portfolio"</p>
                      <p className="font-sf-pro text-sm text-[#8A8A8E]">You have a high concentration in AI tokens</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-[#E5E5EA] p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-[#34C759] flex items-center justify-center">
                      <span className="font-sf-pro text-sm font-bold text-white">TIP</span>
                    </div>
                    <div>
                      <p className="font-sf-pro font-medium text-[#162D3A]">"Take some profits from AI16Z"</p>
                      <p className="font-sf-pro text-sm text-[#8A8A8E]">It's up 40% and may be due for correction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 