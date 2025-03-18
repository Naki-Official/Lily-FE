'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import StaticFallback from '@/components/fallback/StaticFallback';

/**
 * Home page component based on the Figma design
 * Shows a chat interface with Lily AI and navigation to the dashboard
 */
export default function HomePage() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const [messageInput, setMessageInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: string; content: string }[]>([]);
  const _userDisplayName = 'User';
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  // Redirect to auth page if not authenticated
  React.useEffect(() => {
    if (ready && !authenticated) {
      router.push('/auth');
    }
  }, [ready, authenticated, router]);

  // Scroll to the bottom of the messages container when messages change
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Add user message to the chat
      const userMessage = { role: 'user', content: messageInput };
      setMessages((prev) => [...prev, userMessage]);
      setMessageInput('');
      
      // Send message to API and get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add AI response to the chat
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Example swap operation
  const handleExampleSwap = () => {
    setMessageInput('swap 0.1 SOL to USDC');
  };

  // Check if we're in a build/SSG environment
  const isServer = typeof window === 'undefined';
  const isBuildTime = isServer && (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD === 'true');
  
  // During static generation/build time, show a fallback component
  if (isBuildTime) {
    return <StaticFallback />;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <div className="flex-1 overflow-hidden p-4">
        <div ref={messagesContainerRef} className="h-full overflow-y-auto rounded-lg bg-white p-4 shadow-sm">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <h2 className="mb-2 text-xl font-semibold">Welcome to Naki Chat</h2>
              <p className="mb-4 text-center text-gray-600">
                Ask me anything about your Solana wallet or transactions.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setMessageInput('What is my balance?')}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                >
                  What's my balance?
                </button>
                <button
                  onClick={() => setMessageInput('Show my recent transactions')}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                >
                  Recent transactions
                </button>
                <button
                  onClick={handleExampleSwap}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                >
                  Swap Example
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3/4 rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-3/4 rounded-lg bg-gray-200 px-4 py-2 text-gray-800">
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isProcessing}
            className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 