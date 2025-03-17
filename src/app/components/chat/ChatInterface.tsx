'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useChat } from 'ai/react';

// Create a basic UI components since we're having path issues
const Button = ({ 
  children, 
  type = 'button', 
  disabled = false,
  className = '',
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type={type as 'button' | 'submit' | 'reset'}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    {...props}
  />
);

export function ChatInterface() {
  const { user } = usePrivy();
  const userId = user?.id;

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    headers: {
      'x-user-id': userId || '',
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Welcome to Lily AI Trading Assistant! How can I help you today?",
      },
    ],
  });

  return (
    <div className="flex flex-col h-[70vh] w-full max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto pb-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.role === 'user' 
              ? 'bg-blue-100 ml-12' 
              : 'bg-gray-100 mr-12'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2 p-2 border-t">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about Solana trading..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </Button>
      </form>
    </div>
  );
} 