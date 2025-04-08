'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useConversation } from '@/hooks';
import { Message } from '@/types';
import { ChatArea } from '@/components/conversation/layout';
import { useAppDispatch } from '@/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import chatWebSocketClient from '@/lib/websocket/chat-client';

export default function ConversationPage() {
  const searchParams = useSearchParams();
  const { id } = useParams();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { getMessagesForConversation } = useConversation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch conversation messages
  useEffect(() => {
    if (!user?.id || !id) return;
    
    const conversationId = Array.isArray(id) ? id[0] : id;
    
    setIsLoading(true);
    
    getMessagesForConversation(conversationId)
      .then(result => {
        setMessages(result.messages || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to load messages:', error);
        dispatch(addNotification({
          type: 'error',
          message: 'Failed to load conversation messages',
          autoClose: true,
        }));
        setIsLoading(false);
      });
  }, [user?.id, id, getMessagesForConversation, dispatch]);
  
  // If a prompt is provided in the URL query, send it after loading
  useEffect(() => {
    if (!isLoading && user?.id && messages.length === 0) {
      const promptParam = searchParams.get('prompt');
      if (promptParam) {
        const conversationId = Array.isArray(id) ? id[0] : id;
        
        // Create a temporary user message
        const tempUserMessage: Message = {
          id: `temp-${Date.now()}`,
          conversation_id: conversationId,
          content: promptParam,
          role: 'user',
          created_at: new Date().toISOString(),
          user_id: user.id
        };
        
        // Add to messages
        setMessages(prev => [...prev, tempUserMessage]);
        
        // Send message via WebSocket
        try {
          chatWebSocketClient.sendMessage(promptParam, {
            conversation_id: conversationId
          });
        } catch (error) {
          console.error('Failed to send initial prompt:', error);
          dispatch(addNotification({
            type: 'error',
            message: 'Failed to send initial prompt',
            autoClose: true,
          }));
        }
      }
    }
  }, [isLoading, user?.id, messages.length, searchParams, id, dispatch]);
  
  const conversationId = Array.isArray(id) ? id[0] : id;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex space-x-2 items-center">
          <div className="h-3 w-3 bg-primary rounded-full"></div>
          <div className="h-3 w-3 bg-primary rounded-full"></div>
          <div className="h-3 w-3 bg-primary rounded-full"></div>
          <span className="ml-2 text-primary">Loading conversation...</span>
        </div>
      </div>
    );
  }
  
  return (
    <ChatArea
      conversationId={conversationId}
      initialMessages={messages}
    />
  );
}
