'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

/**
 * Dashboard page component based on the Figma design
 * Shows trading performance, portfolio management, and token information
 */
export default function DashboardPage() {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

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
      // Router will handle redirect based on authentication state
    } catch (error) {
      console.error('Logout failed:', error);
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
    <main className="min-h-screen bg-[#F9F9F9]">
      {/* Main content container */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Navigation */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <h1 className="font-sf-pro-rounded text-4xl font-bold tracking-tight text-[#162D3A]">
              Lily
            </h1>
            <nav className="flex space-x-8">
              <button 
                className="font-sf-pro-rounded text-xl font-medium text-[#8A8A8E]"
                onClick={handleHomeClick}
              >
                Home
              </button>
              <button 
                className="font-sf-pro-rounded text-xl font-medium text-[#8A8A8E]"
                onClick={handleTradeClick}
              >
                Trade
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 rounded-full bg-white px-5 py-2.5 shadow-sm">
              <div className="h-9 w-9 rounded-full bg-[#E5E5EA] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#8A8A8E"/>
                  <path d="M10 11.5C5.8525 11.5 2.5 14.8525 2.5 19C2.5 19.5523 2.94772 20 3.5 20H16.5C17.0523 20 17.5 19.5523 17.5 19C17.5 14.8525 14.1475 11.5 10 11.5Z" fill="#8A8A8E"/>
                </svg>
              </div>
              <span className="font-sf-pro text-base text-[#162D3A]">Gustavo Xavier</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 rounded-full px-5 py-2.5 text-[#FF3B30] hover:bg-red-50"
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
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Token</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Address</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Total Received</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Total Spent (USD)</th>
                      <th className="pb-4 text-left font-sf-pro text-sm font-medium text-[#8A8A8E]">Current Value (USD)</th>
                      <th className="pb-4 text-center font-sf-pro text-sm font-medium text-[#8A8A8E]">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { token: 'AI16Z', address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', received: '30.244979', spent: '$491.40', value: '$688.68', profit: '+40.1%', color: '#007AFF', isProfit: true },
                      { token: 'KWEEN', address: 'DEf93bSt8dx58gDFCcz4CwbjYZzjwaRBYAciJYLfdCA9', received: '650.5621', spent: '$446.80', value: '$585.25', profit: '+31.0%', color: '#34C759', isProfit: true },
                      { token: 'KAIA', address: 'KAiA1xTir7B5xTbT5m3bU3GxGcTMFMHG9g3QV9Fb9wG4', received: '120.3456', spent: '$350.00', value: '$280.00', profit: '-20.0%', color: '#FF3B30', isProfit: false },
                      { token: 'TNSR', address: 'TNsRvmcYr5QeT7e4uT7d3YwREFnQM1ubQYX5z4JG8Uvx', received: '45.6789', spent: '$230.50', value: '$310.25', profit: '+34.6%', color: '#FF9500', isProfit: true },
                      { token: 'OPUS', address: 'OPuS1Xn2ZswvZNUNPNPNPNPNPNPNPNPNPNPNPNPNPNPNPN', received: '78.9012', spent: '$400.00', value: '$356.00', profit: '-11.0%', color: '#5856D6', isProfit: false }
                    ].map((item, index) => (
                      <tr key={index} className="border-b border-[#F2F2F7]">
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="font-sf-pro font-medium text-[#162D3A]">{item.token}</span>
                          </div>
                        </td>
                        <td className="py-4 font-sf-pro text-sm text-[#8A8A8E]">{item.address}</td>
                        <td className="py-4 font-sf-pro text-[#162D3A]">{item.received}</td>
                        <td className="py-4 font-sf-pro text-[#162D3A]">{item.spent}</td>
                        <td className="py-4 font-sf-pro text-[#162D3A]">{item.value}</td>
                        <td className="py-4">
                          <div className={`mx-auto w-24 rounded-full px-3 py-1.5 text-center text-sm font-medium text-white ${item.isProfit ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`}>
                            {item.profit}
                          </div>
                        </td>
                      </tr>
                    ))}
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
                  { token: 'AI16Z', percentage: '25%', color: '#007AFF' },
                  { token: 'KWEEN', percentage: '18%', color: '#34C759' },
                  { token: 'KAIA', percentage: '15%', color: '#FF3B30' },
                  { token: 'TNSR', percentage: '12%', color: '#FF9500' },
                  { token: 'OPUS', percentage: '10%', color: '#5856D6' },
                  { token: 'NAVAL', percentage: '8%', color: '#FF2D55' },
                  { token: 'JARVIS', percentage: '5%', color: '#AF52DE' },
                  { token: 'WAIFU', percentage: '4%', color: '#5AC8FA' },
                  { token: 'WHISP', percentage: '2%', color: '#FFCC00' },
                  { token: 'FXN', percentage: '1%', color: '#8A8A8E' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="font-sf-pro text-[#162D3A]">{item.token}</span>
                    </div>
                    <span className="font-sf-pro text-[#8A8A8E]">{item.percentage}</span>
                  </div>
                ))}
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
                    <div className="h-10 w-10 rounded-full bg-[#F7931A] flex items-center justify-center">
                      <span className="font-sf-pro text-sm font-bold text-white">BTC</span>
                    </div>
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