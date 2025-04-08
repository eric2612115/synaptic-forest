'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { Message } from '@/types';
import chatWebSocketClient from '@/lib/websocket/chat-client';

interface ChatAreaProps {
  conversationId: string;
  initialMessages?: Message[];
}

export const ChatArea = ({ conversationId, initialMessages = [] }: ChatAreaProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingState, setThinkingState] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinkingState]);

  // Set up WebSocket event handlers
  useEffect(() => {
    if (!user?.id || !conversationId) return;

    // Function to handle new messages
    const handleNewMessage = (message: Message) => {
      // Check if the message belongs to this conversation
      if (message.conversation_id === conversationId) {
        // If thinking state is finished, clear it
        if (thinkingState && message.role === 'assistant') {
          setThinkingState(null);
        }
        
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    // Function to handle thinking state
    const handleThinking = (message: Message) => {
      if (message.conversation_id === conversationId) {
        setThinkingState(message.content || 'Thinking...');
      }
    };

    // Set up WebSocket callbacks
    const prevCallbacks = chatWebSocketClient.getCallbacks();
    
    chatWebSocketClient.setCallbacks({
      ...prevCallbacks,
      onMessage: (message) => {
        handleNewMessage(message);
        if (prevCallbacks.onMessage) prevCallbacks.onMessage(message);
      },
      onThinking: (message) => {
        handleThinking(message);
        if (prevCallbacks.onThinking) prevCallbacks.onThinking(message);
      }
    });

    // Connect to the specific conversation if not already connected
    if (!chatWebSocketClient.isConnected() || chatWebSocketClient.getConversationId() !== conversationId) {
      chatWebSocketClient.connect(user.id, conversationId);
    }

    // Clean up function
    return () => {
      // Restore previous callbacks
      chatWebSocketClient.setCallbacks(prevCallbacks);
    };
  }, [user?.id, conversationId, thinkingState]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !user?.id || !conversationId) return;
    
    // Create a temporary user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      content: inputMessage,
      role: 'user',
      created_at: new Date().toISOString(),
      user_id: user.id
    };
    
    // Add to messages right away for immediate feedback
    setMessages(prev => [...prev, tempUserMessage]);
    
    // Clear input and start typing indicator
    setInputMessage('');
    setIsTyping(true);
    
    // Send message via WebSocket
    try {
      chatWebSocketClient.sendMessage(inputMessage, {
        conversation_id: conversationId
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could add error handling here with a notification
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputMessage(textarea.value);
    
    // Reset height
    textarea.style.height = 'auto';
    
    // Set new height based on content
    const newHeight = Math.min(textarea.scrollHeight, 200); // max height of 200px
    textarea.style.height = `${newHeight}px`;
  };

  // Format message content with basic markdown and syntax highlighting
  const formatMessageContent = (content: string) => {
    if (!content) return '';
    
    // Replace code blocks with syntax highlighting
    let formatted = content.replace(
      /```([a-z]*)(\n|\r\n|\r)(([\s\S])*?)```/g, 
      '<pre><code class="language-$1">$4</code></pre>'
    );
    
    // Replace inline code
    formatted = formatted.replace(
      /`([^`]+)`/g, 
      '<code>$1</code>'
    );
    
    // Replace line breaks
    formatted = formatted.replace(/\n/g, '<br />');
    
    return formatted;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h3 className="text-lg font-medium mb-2">Start a new conversation</h3>
              <p className="text-muted-foreground">
                Ask a question or share some information to begin building your knowledge forest.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start space-x-2">
                  {/* Avatar for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M16.2 7.8C12.4 4 5.5 9.5 8.2 15.5c2.2 4.9 8.1 6.3 11.7 2.7"></path>
                        <path d="M8.2 7.8c3.8-3.8 10.7 1.7 8 7.7-2.2 4.9-8.1 6.3-11.7 2.7"></path>
                      </svg>
                    </div>
                  )}
                  
                  <div 
                    className={`message-bubble ${message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'}`}
                  >
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content || '') }}
                    />
                  </div>
                  
                  {/* Avatar for user messages */}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mt-1">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Thinking indicator */}
        {thinkingState && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16.2 7.8C12.4 4 5.5 9.5 8.2 15.5c2.2 4.9 8.1 6.3 11.7 2.7"></path>
                  <path d="M8.2 7.8c3.8-3.8 10.7 1.7 8 7.7-2.2 4.9-8.1 6.3-11.7 2.7"></path>
                </svg>
              </div>
              <div className="message-bubble message-bubble-assistant">
                <div className="flex items-center">
                  <div className="thinking-indicator">
                    <div className="thinking-dot animation-delay-200"></div>
                    <div className="thinking-dot animation-delay-400"></div>
                    <div className="thinking-dot animation-delay-600"></div>
                  </div>
                  <span className="ml-2 font-medium">Thinking...</span>
                </div>
                {thinkingState && thinkingState !== 'Thinking...' && (
                  <div className="mt-2 text-muted-foreground text-sm italic">
                    {thinkingState}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messageEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full resize-none overflow-hidden min-h-[44px] max-h-[200px] p-3 pr-10 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input styled-scrollbar"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={handleInput}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            {/* Character count could go here if needed */}
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="bg-primary text-primary-foreground h-[44px] px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;