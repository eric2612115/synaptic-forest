'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useConversation } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import chatWebSocketClient from '@/lib/websocket/chat-client';
import { globalRetryState } from '@/lib/utils/functions';

interface ConversationLayoutProps {
  children: React.ReactNode;
}

export const ConversationLayout = ({ children }: ConversationLayoutProps) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'failed'>('connecting');
  const router = useRouter();
  const { conversations, loadConversations } = useConversation();

  useEffect(() => {
    // Check connection status periodically
    const checkConnection = () => {
      if (chatWebSocketClient.isConnected()) {
        setConnectionStatus('connected');
      } else if (globalRetryState && globalRetryState.connectionFailed) {
        setConnectionStatus('failed');
      } else if (chatWebSocketClient.getReconnectAttempts() > 0) {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('connecting');
      }
    };

    // Initial check
    checkConnection();
    
    // Set up interval for checking
    const interval = setInterval(checkConnection, 2000);
    
    // Set up WebSocket event listeners
    const prevCallbacks = chatWebSocketClient.getCallbacks();
    
    chatWebSocketClient.setCallbacks({
      ...prevCallbacks,
      onConnected: () => {
        setConnectionStatus('connected');
        if (prevCallbacks.onConnected) prevCallbacks.onConnected();
      },
      onDisconnected: () => {
        setConnectionStatus('disconnected');
        if (prevCallbacks.onDisconnected) prevCallbacks.onDisconnected();
      },
      onError: (error) => {
        setConnectionStatus('failed');
        if (prevCallbacks.onError) prevCallbacks.onError(error);
      }
    });

    return () => {
      clearInterval(interval);
      chatWebSocketClient.setCallbacks(prevCallbacks);
    };
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Responsive design - close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar with conversation history */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full border-r border-border bg-card flex-shrink-0 overflow-hidden"
          >
            <Sidebar 
              conversations={conversations} 
              onClose={toggleSidebar}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header with toggle button and connection status */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-muted rounded-md"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              {sidebarOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
          
          {/* Connection status indicator */}
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className={`h-2 w-2 rounded-full mr-2 ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`}></div>
              <span className="text-xs text-muted-foreground">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'disconnected' ? 'Reconnecting...' : 
                 'Connection Failed'}
              </span>
            </div>
            
            <div className="text-sm font-medium">
              {/* Current conversation title could go here */}
            </div>
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ConversationLayout;