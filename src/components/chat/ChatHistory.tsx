import { formatDistanceToNow } from 'date-fns';

import prisma from '@/lib/prisma';

// Define interfaces for our data
interface Conversation {
  id: string;
  userId: string;
  messages: string;
  timestamp: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function ChatHistory({ userId }: { userId: string }) {
  // Fetch recent conversations from database
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 5,
  });
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
      
      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet.</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation: Conversation) => {
            // Parse the messages from JSON string
            const messages = JSON.parse(conversation.messages) as Message[];
            // Get the last user message for display
            const lastUserMessage = messages
              .filter((m: Message) => m.role === 'user')
              .pop();
              
            return (
              <div key={conversation.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Conversation</h3>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })}
                  </span>
                </div>
                
                {lastUserMessage && (
                  <p className="text-sm truncate">
                    "...{lastUserMessage.content.substring(0, 100)}
                    {lastUserMessage.content.length > 100 ? '...' : ''}"
                  </p>
                )}

                {messages.map((msg: Message) => (
                  <div key={msg.id} className="regular-message">
                    {msg.role === 'assistant' && (
                      <>
                        {typeof msg.content === 'string' && 
                         msg.content.includes('Here are the current token prices') ? (
                          <div className='mb-4 flex flex-wrap gap-2'>
                            {/* Token prices UI */}
                          </div>
                        ) : (
                          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 