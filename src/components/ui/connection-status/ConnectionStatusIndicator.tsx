'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import chatWebSocketClient from '@/lib/websocket/chat-client';
import { globalRetryState } from '@/lib/utils/functions';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'failed';

export function ConnectionStatusIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [visible, setVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Initial status check
    const initialStatus = chatWebSocketClient.isConnected() ? 'connected' : 'connecting';
    setStatus(initialStatus);
    
    // Only show indicator if not connected
    setVisible(initialStatus !== 'connected');
    
    // Set up WebSocket status listeners
    const onConnected = () => {
      setStatus('connected');
      // Hide after a short delay when connected
      setTimeout(() => setVisible(false), 3000);
      setRetryCount(0);
    };

    const onDisconnected = () => {
      setStatus('disconnected');
      setVisible(true);
    };

    const onError = () => {
      setStatus('failed');
      setVisible(true);
    };
    
    // Track retry attempts
    const checkRetryStatus = setInterval(() => {
      if (globalRetryState && typeof chatWebSocketClient.getReconnectAttempts === 'function') {
        const attempts = chatWebSocketClient.getReconnectAttempts();
        setRetryCount(attempts);
        
        if (globalRetryState.connectionFailed) {
          setStatus('failed');
          setVisible(true);
        }
      }
    }, 1000);

    // Register event callbacks
    const prevCallbacks = chatWebSocketClient.getCallbacks();
    
    chatWebSocketClient.setCallbacks({
      ...prevCallbacks,
      onConnected: () => {
        onConnected();
        if (prevCallbacks.onConnected) prevCallbacks.onConnected();
      },
      onDisconnected: () => {
        onDisconnected();
        if (prevCallbacks.onDisconnected) prevCallbacks.onDisconnected();
      },
      onError: (error) => {
        onError();
        if (prevCallbacks.onError) prevCallbacks.onError(error);
      }
    });

    return () => {
      clearInterval(checkRetryStatus);
      // Restore previous callbacks
      chatWebSocketClient.setCallbacks(prevCallbacks);
    };
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className={`
            flex items-center space-x-2 px-4 py-2 rounded-md shadow-lg
            ${status === 'connected' ? 'bg-green-100 dark:bg-green-900' : 
              status === 'connecting' ? 'bg-yellow-100 dark:bg-yellow-900' : 
              'bg-red-100 dark:bg-red-900'}
          `}>
            <div className={`
              h-3 w-3 rounded-full 
              ${status === 'connected' ? 'bg-green-500' : 
                status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'}
            `}></div>
            <span className={`
              text-sm font-medium
              ${status === 'connected' ? 'text-green-800 dark:text-green-200' : 
                status === 'connecting' ? 'text-yellow-800 dark:text-yellow-200' : 
                'text-red-800 dark:text-red-200'}
            `}>
              {status === 'connected' ? 'Connected' : 
               status === 'connecting' ? 'Connecting to server...' : 
               status === 'disconnected' ? 'Connection lost' : 
               `Connection failed ${retryCount > 0 ? `(${retryCount} retries)` : ''}`}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { ConnectionStatusIndicator as default };