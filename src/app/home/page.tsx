'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { TokenIcon } from '@/components/ui/TokenIcon';

import { tokens } from '@/constant/tokens';

// Add keyframe animations 
const fadeInKeyframes = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

/**
 * Home page component based on the Figma design
 * Shows a chat interface with Lily AI and navigation to the dashboard
 */
export default function HomePage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  
  // Add the keyframe style to the document
  React.useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(fadeInKeyframes));
    
    // Append to the head of the document
    document.head.appendChild(style);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // User's SOL balance
  const [solBalance, setSolBalance] = React.useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  
  // Swap state
  const [isSwapping, setIsSwapping] = React.useState(false);
  const [swapStatus, setSwapStatus] = React.useState<string | null>(null);
  const [swapErrorMessage, setSwapErrorMessage] = React.useState<string | null>(null);
  
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
               '• Viewing transaction history\n' +
               '• Swapping tokens\n\n' +
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
    
    // Check if this is a swap request
    const isSwapRequest = input.toLowerCase().startsWith('swap');
    if (isSwapRequest) {
      setIsSwapping(true);
      setSwapErrorMessage(null);
    }
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      console.log('Sending message to API:', input);
      
      // Prepare request data
      const requestData = {
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      };
      
      console.log('Request data:', JSON.stringify(requestData));
      
      // Send message to API with detailed error logging
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not extract error details');
        console.error(`API Error (${response.status}): ${errorText}`);
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Check if response contains an error message
      if (data.error) {
        console.error('API returned error:', data.error, data.details);
        throw new Error(data.error);
      }
      
      // Update swap status if this was a swap request
      if (isSwapRequest) {
        if (data.response.includes('Successfully swapped')) {
          setSwapStatus('success');
          setSwapErrorMessage(null);
        } else if (data.response.includes('Failed to execute the swap') || 
                  data.response.includes('network is currently experiencing high traffic') ||
                  data.response.includes('rate limit exceeded')) {
          setSwapStatus('error');
          
          // Extract the error message
          let errorMsg = 'Unknown error occurred during swap';
          
          if (data.response.includes('Insufficient funds')) {
            errorMsg = 'Insufficient funds for this swap';
          } else if (data.response.includes('slippage tolerance')) {
            errorMsg = 'Price movement exceeded slippage tolerance';
          } else if (data.response.includes('network is currently experiencing high traffic') || 
                    data.response.includes('rate limit') || 
                    data.response.includes('429')) {
            errorMsg = 'Network congestion - please try again in a few minutes';
          }
          
          setSwapErrorMessage(errorMsg);
        } else {
          setSwapStatus(null);
          setSwapErrorMessage(null);
        }
        setIsSwapping(false);
      }
      
      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, id: Date.now().toString() },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add a more detailed error message to the chat
      const errorMessage = error instanceof Error 
        ? `Sorry, there was an error: ${error.message}`
        : 'Sorry, there was an unknown error processing your request.';
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessage, id: Date.now().toString() },
      ]);
      
      if (isSwapRequest) {
        setSwapStatus('error');
        setSwapErrorMessage('Network error - please try again later');
        setIsSwapping(false);
      }
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
               '• Viewing transaction history\n' +
               '• Swapping tokens\n\n' +
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

  const handlePortfolioClick = () => {
    router.push('/dashboard/portfolio');
  };

  const redirectToAuth = () => {
    router.push('/auth');
  };

  const handleLogout = () => {
    // In a real app, this would log the user out
  };

  // Optimized function to fetch both wallet address and SOL balance in a single function
  const fetchWalletInfo = React.useCallback(async () => {
    if (!authenticated) return;
    
    setIsLoadingBalance(true);
    
    try {
      // First fetch wallet address
      const addressResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Ensure fresh data
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'address' }],
        }),
      });
      
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        // Extract address from response
        const addressMatch = addressData.response.match(/address is ([a-zA-Z0-9]{32,44})/i);
        if (addressMatch && addressMatch[1]) {
          const fullAddress = addressMatch[1];
          setWalletAddress(fullAddress);
        }
      }
      
      // Then fetch SOL balance
      const balanceResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Ensure fresh data
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'balance' }],
        }),
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        // Extract balance from response
        const balanceMatch = balanceData.response.match(/([0-9.]+)\s*SOL/i);
        if (balanceMatch && balanceMatch[1]) {
          setSolBalance(balanceMatch[1]);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [authenticated]);
  
  // Fetch wallet info when component mounts and user is authenticated
  React.useEffect(() => {
    if (authenticated) {
      fetchWalletInfo();
    }
  }, [authenticated, fetchWalletInfo]);

  // Update welcome message to include swap command example
  React.useEffect(() => {
    // Only run once when component mounts
    const hasWelcomeMessage = messages.some(msg => msg.id === 'welcome-message');
    
    if (!hasWelcomeMessage) {
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m Lily, your Solana AI assistant. I can help you with:\n\n' +
                'Checking your wallet balance\n' +
                'Viewing your wallet address\n' +
                'Getting token prices\n' +
                'Viewing transaction history\n' +
                'Swapping tokens (try "swap 1 USDC to SOL")\n\n' +
                'Try clicking one of the quick action buttons below or type your question.',
        id: 'welcome-message'
      }]);
    }
  }, []);

  // Add this function to the HomePage component
  const handleTestAPI = async () => {
    setIsLoading(true);
    
    // Add a user message
    const userMessage = { role: 'user', content: 'Testing API connection...', id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    
    try {
      // First test the test API endpoint
      console.log('Testing API connection with test endpoint...');
      const testResponse = await fetch('/api/test', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!testResponse.ok) {
        throw new Error(`Test API failed: ${testResponse.status} ${testResponse.statusText}`);
      }
      
      const testData = await testResponse.json();
      console.log('Test API response:', testData);
      
      // Add success message
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: `API connection successful!\nServer time: ${testData.timestamp}\n\nYou can now try other commands.`, 
          id: Date.now().toString() 
        },
      ]);
    } catch (error) {
      console.error('Error testing API:', error);
      // Add a more detailed error message
      const errorMessage = error instanceof Error 
        ? `API test failed: ${error.message}`
        : 'API test failed with an unknown error';
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessage, id: Date.now().toString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-custom-gradient-alt">
        <div className="relative h-12 w-12 mb-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
        </div>
        <p className="text-white/80 font-sf-pro text-lg animate-pulse">Loading Lily...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-custom-gradient-alt">
      <div className="mx-auto max-w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6 md:py-8">
        {/* Navigation */}
        <div className="mb-8 md:mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6 md:space-x-8">
            <h1 className="font-sf-pro-rounded text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Lily
            </h1>
            
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              <button 
                className="font-sf-pro-rounded text-base lg:text-lg font-medium text-white/80 hover:text-white transition-colors"
                onClick={handleDashboardClick}
              >
                Dashboard
              </button>
              <button 
                className="font-sf-pro-rounded text-base lg:text-lg font-medium text-white/80 hover:text-white transition-colors"
                onClick={handleTradeClick}
              >
                Trade
              </button>
              <button 
                className="font-sf-pro-rounded text-base lg:text-lg font-medium text-white/80 hover:text-white transition-colors"
                onClick={handlePortfolioClick}
              >
                Portfolio
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-4">
            {authenticated && (
              <>
                <div className="flex items-center space-x-2 md:space-x-3">
                  {walletAddress ? (
                    <div className="flex items-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 md:px-5 md:py-2.5 shadow-sm border border-white/20 transition-all duration-300 hover:bg-white/15">
                      <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-[#E0F2FF] flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 7L12 13L21 7" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex items-center">
                        <span className="font-sf-pro text-xs md:text-base text-white">
                          {`${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`}
                        </span>
                      </div>
                    </div>
                  ) : isLoadingBalance ? (
                    <div className="flex items-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 md:px-5 md:py-2.5 shadow-sm border border-white/20 animate-pulse">
                      <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-white/20"></div>
                      <div className="h-4 w-16 bg-white/20 rounded-full"></div>
                    </div>
                  ) : null}
                  
                  {solBalance !== null ? (
                    <div className="flex items-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 md:px-5 md:py-2.5 shadow-sm border border-white/20 transition-all duration-300 hover:bg-white/15">
                      <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-custom-accent flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill="#312F32" />
                          <path d="M6.5 13.5L13.5 6.5M6.5 6.5L13.5 13.5" stroke="#CEA388" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="flex items-center">
                        <span className="font-sf-pro text-xs md:text-base text-white">{solBalance} SOL</span>
                        <button 
                          className="ml-2 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                          onClick={fetchWalletInfo}
                          disabled={isLoadingBalance}
                          aria-label="Refresh balance"
                        >
                          {isLoadingBalance ? (
                            <span className="inline-block animate-spin text-xs">↻</span>
                          ) : (
                            <span className="text-xs">↻</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : isLoadingBalance ? (
                    <div className="flex items-center space-x-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 md:px-5 md:py-2.5 shadow-sm border border-white/20 animate-pulse">
                      <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-white/20"></div>
                      <div className="h-4 w-16 bg-white/20 rounded-full"></div>
                    </div>
                  ) : null}
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 rounded-full px-3 py-1.5 md:px-5 md:py-2.5 text-white bg-[rgba(255,59,48,0.2)] hover:bg-[rgba(255,59,48,0.3)] transition-all duration-300 border border-[rgba(255,59,48,0.3)]"
                >
                  <span className="font-sf-pro text-xs md:text-base">Log out</span>
                </button>
              </>
            )}
            
            {!authenticated && (
              <button
                onClick={redirectToAuth}
                className="flex items-center space-x-2 rounded-full px-4 py-2 md:px-5 md:py-2.5 bg-custom-accent hover:opacity-90 transition-opacity"
              >
                <span className="font-sf-pro text-sm md:text-base text-[#312F32] font-medium">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile navigation - Added for better mobile experience */}
        <div className="w-full md:hidden flex justify-center mt-4 mb-2">
          <div className="flex space-x-4 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
            <button 
              className="rounded-full px-4 py-2 font-sf-pro text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
              onClick={handleDashboardClick}
            >
              Dashboard
            </button>
            <button 
              className="rounded-full px-4 py-2 font-sf-pro text-sm text-white/90 hover:text-white bg-white/15 border border-white/20 shadow-sm transition-all duration-200"
              onClick={handleTradeClick}
            >
              Trade
            </button>
            <button 
              className="rounded-full px-4 py-2 font-sf-pro text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
              onClick={handlePortfolioClick}
            >
              Portfolio
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="mt-8 md:mt-12 mx-auto w-full max-w-[95%] xl:max-w-[90%]">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-sf-pro-rounded font-bold text-white mb-4 md:mb-6 leading-tight">
              Welcome to the Future of Finance
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-8 md:mb-10 max-w-3xl mx-auto">
              Seamlessly trade and manage your assets with our AI-powered platform
            </p>
            
            {!authenticated && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={redirectToAuth}
                  className="px-6 py-3 md:px-8 md:py-4 rounded-full bg-custom-accent hover:opacity-90 transition-opacity text-[#312F32] font-sf-pro font-medium text-base md:text-lg shadow-lg"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
          
          {/* Grid layout for main content */}
          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-4">
            {/* Left column - Chat */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              {/* Chat box */}
              <div className="rounded-2xl md:rounded-3xl bg-white p-4 md:p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-6 md:mb-8 max-h-[400px] md:max-h-[500px] lg:max-h-[550px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {/* Display Lily AI header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#007AFF] flex items-center justify-center">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white"/>
                        <path d="M8 12L11 15L16 9" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h2 className="font-sf-pro-rounded text-xl md:text-2xl font-semibold text-[#162D3A]">
                      Lily AI
                    </h2>
                  </div>
                  
                  {/* Display messages */}
                  <div className="space-y-3 md:space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                          message.role === 'user' 
                            ? 'bg-[#007AFF] text-white' 
                            : 'bg-[#F2F2F7] text-[#162D3A]'
                        }`}>
                          <p className="font-sf-pro text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 bg-[#F2F2F7] text-[#162D3A]">
                          <div className="flex items-center space-x-2">
                            <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#007AFF] flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white"/>
                              </svg>
                            </div>
                            <p className="font-sf-pro text-xs md:text-sm text-[#8A8A8E]">
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
                    className="rounded-full bg-[#F2F2F7] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
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
                    className="rounded-full bg-[#F2F2F7] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
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
                    className="rounded-full bg-[#F2F2F7] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
                    disabled={isLoading}
                  >
                    Transaction History
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInput("Swap 1 USDC to SOL");
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }, 100);
                    }}
                    className="rounded-full bg-[#E0F2FF] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#007AFF] hover:bg-[#B8E2FF] transition-colors"
                    disabled={isLoading || isSwapping}
                  >
                    Swap 
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
                    className="rounded-full bg-[#F2F2F7] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
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
                    className="rounded-full bg-[#F2F2F7] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#162D3A] hover:bg-[#E5E5EA] transition-colors"
                    disabled={isLoading}
                  >
                    Token Prices
                  </button>
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="rounded-full bg-[#FFEBE9] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#FF3B30] hover:bg-[#FFD1CF] transition-colors"
                    disabled={isLoading}
                  >
                    Clear Chat
                  </button>
                  <button
                    type="button"
                    onClick={handleTestAPI}
                    className="rounded-full bg-[#E0F2FF] px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-[#007AFF] hover:bg-[#B8E2FF] transition-colors"
                    disabled={isLoading}
                  >
                    Test API
                  </button>
                </div>
                
                {/* Token quick access */}
                {messages.some(msg => 
                  msg.role === 'assistant' && 
                  msg.content.includes('Here are the current token prices')
                ) && (
                  <div className="mb-4 flex flex-wrap gap-2 items-center">
                    <span className="text-xs md:text-sm text-[#8A8A8E] mr-1">Quick access:</span>
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
                        className="rounded-full bg-[#E0F2FF] px-2 py-1 md:px-3 md:py-1 text-xs font-medium text-[#007AFF] hover:bg-[#B8E2FF] transition-colors"
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
                    className="w-full rounded-full border border-[#E5E5EA] bg-[#F9F9F9] px-4 py-3 md:px-6 md:py-4 pr-12 md:pr-16 text-sm md:text-base text-[#162D3A] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all duration-200 hover:shadow-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full ${
                      isLoading ? 'bg-[#8A8A8E]' : 'bg-[#007AFF] hover:bg-[#0062cc] active:bg-[#0055b3]'
                    } p-2 md:p-3 shadow-sm transition-all duration-200`}
                    disabled={isLoading}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" 
                      className={`transition-transform duration-200 ${input.trim() ? 'scale-100' : 'scale-90'}`}>
                      <path d="M18.3333 1.66669L9.16667 10.8334" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.3333 1.66669L12.5 18.3334L9.16667 10.8334L1.66667 7.50002L18.3333 1.66669Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </form>
                
                {/* Quick swap component - Kept for status messages */}
                {swapStatus && (
                  <div className={`mt-4 p-4 rounded-lg text-white text-sm ${
                    swapStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {swapStatus === 'success' 
                      ? 'Swap successful! Your tokens have been exchanged.' 
                      : swapErrorMessage || 'Swap failed. Please try again or check your wallet balance.'}
                    <button 
                      onClick={() => {
                        setSwapStatus(null);
                        setSwapErrorMessage(null);
                      }} 
                      className="ml-2 text-white font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              {/* Lily's recent picks */}
              <div>
                <h2 className="font-sf-pro-rounded text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-white">
                  Lily's recent picks
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Token cards */}
                  {[
                    { name: tokens.AI16Z.name, symbol: 'AI16Z', change: '+67%', value: '37%', color: tokens.AI16Z.color },
                    { name: tokens.KWEEN.name, symbol: 'KWEEN', change: '+42%', value: '28%', color: tokens.KWEEN.color },
                    { name: tokens.TNSR.name, symbol: 'TNSR', change: '+31%', value: '19%', color: tokens.TNSR.color },
                    { name: tokens.OPUS.name, symbol: 'OPUS', change: '+25%', value: '15%', color: tokens.OPUS.color },
                    { name: tokens.NAVAL.name, symbol: 'NAVAL', change: '+18%', value: '12%', color: tokens.NAVAL.color },
                    { name: tokens.JARVIS.name, symbol: 'JARVIS', change: '+15%', value: '9%', color: tokens.JARVIS.color }
                  ].map((token, index) => (
                    <div 
                      key={index} 
                      className="rounded-xl md:rounded-2xl bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/10 hover:border-white/20"
                      style={{
                        animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                        opacity: 0
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#F2F2F7] flex items-center justify-center shadow-sm">
                            <TokenIcon symbol={token.symbol} size={32} />
                          </div>
                          <div>
                            <p className="font-sf-pro text-base md:text-lg font-bold text-[#162D3A]">{token.name}</p>
                            <p className="font-sf-pro text-sm md:text-base text-[#8A8A8E]">{token.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-sf-pro text-base md:text-lg font-bold text-[#162D3A]">{token.value}</p>
                          <p className="font-sf-pro text-sm md:text-base font-bold text-[#34C759]">{token.change}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Suggestions */}
            <div className="space-y-4 md:space-y-6">
              {/* Investment Advice */}
              <div className="rounded-xl bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#E0F2FF] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#007AFF" fillOpacity="0.2"/>
                      <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="font-sf-pro-rounded text-lg md:text-xl font-semibold text-[#162D3A]">Investment Advice</h3>
                </div>
                <p className="text-xs md:text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                  "How should I invest $100?"<br />
                  "Analyze my portfolio and suggest investments."
                </p>
              </div>
              
              {/* Risk Management */}
              <div className="rounded-xl bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#FFEBE9] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#FF3B30" fillOpacity="0.2"/>
                      <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="font-sf-pro-rounded text-lg md:text-xl font-semibold text-[#162D3A]">Risk Management</h3>
                </div>
                <p className="text-xs md:text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                  "How can I minimize losses during market drops?"<br />
                  "What adjustments should I make to my portfolio for safety?"
                </p>
              </div>
              
              {/* Personalized Strategy */}
              <div className="rounded-xl bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#F0E6FF] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#5856D6" fillOpacity="0.2"/>
                      <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#5856D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="font-sf-pro-rounded text-lg md:text-xl font-semibold text-[#162D3A]">Personalized Strategy</h3>
                </div>
                <p className="text-xs md:text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                  "Based on my portfolio, what's a smart trading move now?"<br />
                  "Tailor a trading strategy for my risk profile."
                </p>
              </div>
              
              {/* Actionable Commands */}
              <div className="rounded-xl bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#E3FFF3] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#34C759" fillOpacity="0.2"/>
                      <path d="M8 12L11 15L16 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="font-sf-pro-rounded text-lg md:text-xl font-semibold text-[#162D3A]">Actionable Commands</h3>
                </div>
                <p className="text-xs md:text-sm text-[#8A8A8E] font-sf-pro leading-relaxed">
                  "Show me the top recommended tokens for today."<br />
                  "Execute a trade for the best-performing token."
                </p>
              </div>
              
              {/* Dashboard button */}
              <button
                onClick={handleDashboardClick}
                className="w-full rounded-xl bg-white/10 backdrop-blur-sm px-6 py-4 text-center font-sf-pro text-base md:text-lg font-semibold tracking-wide text-white transition-all hover:bg-white/15 hover:scale-105 shadow-sm border border-white/20 mt-2"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 