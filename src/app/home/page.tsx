'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { TokenIcon } from '@/components/ui/TokenIcon';

/**
 * Home page component based on the Figma design
 * Shows a chat interface with Lily AI and navigation to the dashboard
 */
export default function HomePage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [message, setMessage] = React.useState('');
  
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

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the message to an API
    setMessage('');
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
              <button className="font-sf-pro-rounded text-xl font-medium text-[#162D3A]">
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
              <span className="font-sf-pro text-base text-[#162D3A]">{userDisplayName}</span>
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
          {/* Left column - Chat */}
          <div className="col-span-2 space-y-8">
            {/* Chat box */}
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-[#007AFF] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white"/>
                      <path d="M8 12L11 15L16 9" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="font-sf-pro-rounded text-2xl font-semibold text-[#162D3A]">
                    Lily AI
                  </h2>
                </div>
                <p className="font-sf-pro text-xl text-[#162D3A] leading-relaxed">
                  Good day! How may I assist you today?
                </p>
              </div>
              
              {/* Chat input */}
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full rounded-full border border-[#E5E5EA] bg-[#F9F9F9] px-6 py-4 pr-16 text-[#162D3A] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[#007AFF] p-3 shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.3333 1.66669L9.16667 10.8334" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.3333 1.66669L12.5 18.3334L9.16667 10.8334L1.66667 7.50002L18.3333 1.66669Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>
            </div>
            
            {/* Lily's recent picks */}
            <div>
              <h2 className="font-sf-pro-rounded text-2xl font-semibold mb-6 text-[#162D3A]">
                Lily's recent picks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Token cards */}
                {[
                  { name: 'AI16Z', symbol: 'AI16Z', change: '+67%', value: '37%', color: '#007AFF' },
                  { name: 'PEPE', symbol: 'PEPE', change: '+42%', value: '28%', color: '#34C759' },
                  { name: 'DOGE', symbol: 'DOGE', change: '+31%', value: '19%', color: '#FF9500' },
                  { name: 'SHIB', symbol: 'SHIB', change: '+25%', value: '15%', color: '#FF3B30' },
                  { name: 'FLOKI', symbol: 'FLOKI', change: '+18%', value: '12%', color: '#5856D6' },
                  { name: 'BONK', symbol: 'BONK', change: '+15%', value: '9%', color: '#FF2D55' }
                ].map((token, index) => (
                  <div key={index} className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-[#F2F2F7] flex items-center justify-center">
                          <TokenIcon symbol={token.symbol} size={32} />
                        </div>
                        <div>
                          <p className="font-sf-pro text-lg font-bold text-[#162D3A]">{token.name}</p>
                          <p className="font-sf-pro text-base text-[#8A8A8E]">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-sf-pro text-lg font-bold text-[#162D3A]">{token.value}</p>
                        <p className="font-sf-pro text-base font-bold text-[#34C759]">{token.change}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Suggestions */}
          <div className="space-y-6">
            {/* Investment Advice */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#E0F2FF] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#007AFF" fillOpacity="0.2"/>
                    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-sf-pro-rounded text-xl font-semibold text-[#162D3A]">Investment Advice</h3>
              </div>
              <p className="text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                "How should I invest $100?"<br />
                "Analyze my portfolio and suggest investments."
              </p>
            </div>
            
            {/* Risk Management */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#FFEBE9] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#FF3B30" fillOpacity="0.2"/>
                    <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-sf-pro-rounded text-xl font-semibold text-[#162D3A]">Risk Management</h3>
              </div>
              <p className="text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                "How can I minimize losses during market drops?"<br />
                "What adjustments should I make to my portfolio for safety?"
              </p>
            </div>
            
            {/* Personalized Strategy */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#F0E6FF] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#5856D6" fillOpacity="0.2"/>
                    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#5856D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-sf-pro-rounded text-xl font-semibold text-[#162D3A]">Personalized Strategy</h3>
              </div>
              <p className="text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                "Based on my portfolio, what's a smart trading move now?"<br />
                "Tailor a trading strategy for my risk profile."
              </p>
            </div>
            
            {/* Actionable Commands */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#E3FFF3] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#34C759" fillOpacity="0.2"/>
                    <path d="M8 12L11 15L16 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-sf-pro-rounded text-xl font-semibold text-[#162D3A]">Actionable Commands</h3>
              </div>
              <p className="text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                "Show me the top recommended tokens for today."<br />
                "Execute a trade for the best-performing token."
              </p>
            </div>
            
            {/* Dashboard button */}
            <button
              onClick={handleDashboardClick}
              className="w-full rounded-xl bg-[#162D3A] px-6 py-4 text-center font-sf-pro text-lg font-semibold tracking-wide text-white transition-all hover:bg-opacity-90 shadow-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 