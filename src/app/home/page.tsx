'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { TokenIcon } from '@/components/ui/TokenIcon';

import { tokens } from '@/constant/tokens';

/**
 * Home page component based on the Figma design
 * Shows a chat interface with Lily AI and navigation to the dashboard
 */
export default function HomePage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  
  // User's SOL balance
  const [solBalance, setSolBalance] = React.useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = React.useState(false);
  
  // Fetch user's SOL balance
  const fetchSolBalance = React.useCallback(async () => {
    if (!authenticated) return;
    
    setIsLoadingBalance(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'balance' }],
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      
      // Extract balance from response
      const balanceMatch = data.response.match(/([0-9.]+)\s*SOL/i);
      if (balanceMatch && balanceMatch[1]) {
        setSolBalance(balanceMatch[1]);
      }
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [authenticated]);
  
  // Fetch balance when component mounts and user is authenticated
  React.useEffect(() => {
    if (authenticated) {
      fetchSolBalance();
    }
  }, [authenticated, fetchSolBalance]);
  
  // Chat state with local storage persistence
  const [messages, setMessages] = React.useState<Array<{ role: string; content: string; id: string }>>(() => {
    // Try to load messages from localStorage
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('lily-chat-history');
      if (savedMessages) {
        try {
          return JSON.parse(savedMessages);
        } catch (e) {
          console.error('Failed to parse saved messages:', e);
        }
      }
    }
    
    // Default initial message
    return [{
      role: 'assistant',
      content: 'Hello! I\'m Lily, your Solana AI assistant. I can help you with:\n\n' +
               '• Checking your wallet balance\n' +
               '• Viewing your wallet address\n' +
               '• Getting token prices\n' +
               '• Viewing transaction history\n\n' +
               'Try clicking one of the quick action buttons below or type your question.',
      id: 'welcome-message'
    }];
  });
  
  // Save messages to localStorage whenever they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lily-chat-history', JSON.stringify(messages));
    }
  }, [messages]);
  
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [typingDots, setTypingDots] = React.useState(1);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Typing indicator animation
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      interval = setInterval(() => {
        setTypingDots(prev => prev < 3 ? prev + 1 : 1);
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);
  
  // Scroll to bottom of messages
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, id: Date.now().toString() },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.', id: Date.now().toString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear chat history
  const handleClearChat = () => {
    const newMessages = [{
      role: 'assistant',
      content: 'Chat history cleared. I\'m Lily, your Solana AI assistant. I can help you with:\n\n' +
               '• Checking your wallet balance\n' +
               '• Viewing your wallet address\n' +
               '• Getting token prices\n' +
               '• Viewing transaction history\n\n' +
               'Try clicking one of the quick action buttons below or type your question.',
      id: `welcome-${Date.now()}`
    }];
    
    setMessages(newMessages);
    
    // Also clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lily-chat-history', JSON.stringify(newMessages));
    }
  };
  
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
            
            {/* SOL Balance */}
            {solBalance !== null && (
              <div className="flex items-center space-x-3 rounded-full bg-white px-5 py-2.5 shadow-sm">
                <div className="h-9 w-9 rounded-full bg-[#E5E5EA] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="10" fill="#9945FF" />
                    <path d="M6.5 13.5L13.5 6.5M6.5 6.5L13.5 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <span className="font-sf-pro text-base text-[#162D3A]">{solBalance} SOL</span>
                  <button 
                    onClick={fetchSolBalance}
                    className="ml-2 text-xs text-[#007AFF] hover:underline"
                    disabled={isLoadingBalance}
                  >
                    {isLoadingBalance ? '...' : '↻'}
                  </button>
                </div>
              </div>
            )}
            
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
              <div className="mb-8 max-h-[400px] overflow-y-auto">
                {/* Display Lily AI header */}
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
                
                {/* Display messages */}
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user' 
                          ? 'bg-[#007AFF] text-white' 
                          : 'bg-[#F2F2F7] text-[#162D3A]'
                      }`}>
                        <p className="font-sf-pro text-base whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#F2F2F7] text-[#162D3A]">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-[#007AFF] flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white"/>
                            </svg>
                          </div>
                          <p className="font-sf-pro text-sm text-[#8A8A8E]">
                            Lily is typing
                            {'.'.repeat(typingDots)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Quick action buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInput("What's my wallet balance?");
                    // Submit the form programmatically after setting the input
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }, 100);
                  }}
                  className="rounded-full bg-[#F2F2F7] px-4 py-2 text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
                  disabled={isLoading}
                >
                  Check Balance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("What's my wallet address?");
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }, 100);
                  }}
                  className="rounded-full bg-[#F2F2F7] px-4 py-2 text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
                  disabled={isLoading}
                >
                  Show Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("Show my transaction history");
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }, 100);
                  }}
                  className="rounded-full bg-[#F2F2F7] px-4 py-2 text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
                  disabled={isLoading}
                >
                  Transaction History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("What commands can you help me with?");
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }, 100);
                  }}
                  className="rounded-full bg-[#F2F2F7] px-4 py-2 text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
                  disabled={isLoading}
                >
                  Help
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("Show me token prices");
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }, 100);
                  }}
                  className="rounded-full bg-[#F2F2F7] px-4 py-2 text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
                  disabled={isLoading}
                >
                  Token Prices
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="rounded-full bg-[#FFEBE9] px-4 py-2 text-sm font-medium text-[#FF3B30] hover:bg-[#FFD1CF] transition-colors"
                  disabled={isLoading}
                >
                  Clear Chat
                </button>
              </div>
              
              {/* Token quick access */}
              {messages.some(msg => 
                msg.role === 'assistant' && 
                msg.content.includes('Here are the current token prices')
              ) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="text-sm text-[#8A8A8E] mr-2 self-center">Quick access:</span>
                  {['SOL', 'USDC', 'BONK', 'JTO', 'PYTH', 'WIF'].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => {
                        setInput(`What's the price of ${token}?`);
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        }, 100);
                      }}
                      className="rounded-full bg-[#E0F2FF] px-3 py-1 text-xs font-medium text-[#007AFF] hover:bg-[#B8E2FF] transition-colors"
                      disabled={isLoading}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Chat input */}
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full rounded-full border border-[#E5E5EA] bg-[#F9F9F9] px-6 py-4 pr-16 text-[#162D3A] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full ${
                    isLoading ? 'bg-[#8A8A8E]' : 'bg-[#007AFF]'
                  } p-3 shadow-sm`}
                  disabled={isLoading}
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
                  { name: tokens.AI16Z.name, symbol: 'AI16Z', change: '+67%', value: '37%', color: tokens.AI16Z.color },
                  { name: tokens.KWEEN.name, symbol: 'KWEEN', change: '+42%', value: '28%', color: tokens.KWEEN.color },
                  { name: tokens.TNSR.name, symbol: 'TNSR', change: '+31%', value: '19%', color: tokens.TNSR.color },
                  { name: tokens.OPUS.name, symbol: 'OPUS', change: '+25%', value: '15%', color: tokens.OPUS.color },
                  { name: tokens.NAVAL.name, symbol: 'NAVAL', change: '+18%', value: '12%', color: tokens.NAVAL.color },
                  { name: tokens.JARVIS.name, symbol: 'JARVIS', change: '+15%', value: '9%', color: tokens.JARVIS.color }
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