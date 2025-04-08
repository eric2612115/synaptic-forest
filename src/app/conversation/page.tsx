'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useConversation } from '@/hooks';
import { useAppDispatch } from '@/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import chatWebSocketClient from '@/lib/websocket/chat-client';
import { globalRetryState } from '@/lib/utils/functions';
import { WelcomeScreen } from '@/components/conversation/welcome/WelcomeScreen';

export default function ConversationsPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loadConversations } = useConversation();
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.id) {
      // Check connection status and avoid redundant connections
      if (chatWebSocketClient.isConnected()) {
        console.log('WebSocket already connected, skipping connection');
        return;
      }
      
      // Check global connection status
      if (globalRetryState && globalRetryState.connectionFailed) {
        console.log('Backend service is known to be unavailable, skipping connection');
        return;
      }

      // Set up WebSocket callbacks
      chatWebSocketClient.setCallbacks({
        onConnected: () => {
          console.log('WebSocket connected');
          
          // Request conversations list after successful connection
          const listRequest = {
            query: JSON.stringify({
              action: 'list_conversations',
              user_id: user.id
            })
          };
          
          try {
            if (chatWebSocketClient.isConnected()) {
              chatWebSocketClient.sendMessage(JSON.stringify(listRequest), {});
            }
          } catch (error) {
            console.error('Failed to request conversations list:', error);
          }
        },
        onDisconnected: () => {
          console.log('WebSocket disconnected');
        },
        onError: (error) => {
          console.error('WebSocket error:', error);
          dispatch(addNotification({
            type: 'error',
            message: typeof error === 'string' ? error : error.message || 'WebSocket error',
            autoClose: true,
          }));
        },
        onMessage: (message) => {
          // Handle conversations list response
          console.log('WebSocket message received:', message);
          
          if (message.type === 'conversations_list' || 
              (message.message_type === 'response' && message.data?.conversations)) {
            // Update Redux store with conversations list
            const conversations = message.data?.conversations || message.conversations;
            if (conversations && Array.isArray(conversations)) {
              dispatch({
                type: 'conversation/fetchConversations/fulfilled',
                payload: {
                  conversations: conversations.map(c => ({ ...c, id: c._id || c.id })),
                  total: conversations.length
                }
              });
            }
          }
        }
      });
      
      // Initialize WebSocket connection without specifying conversation ID
      try {
        chatWebSocketClient.connect(user.id);
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
      }
    }
  }, [user?.id, dispatch]);

  // Main content - welcome screen for /conversation path
  return <WelcomeScreen />;
}
