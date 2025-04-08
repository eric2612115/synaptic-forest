'use client';

import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, X as XIcon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { removeNotification } from '@/store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';

type Notification = {
  id: string;
  title?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  autoClose?: boolean;
  timestamp?: number;
};

// Group similar notifications
type NotificationGroup = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  count: number;
  timestamp: number;
  notifications: Notification[];
};

export default function Notifications() {
  const [customNotifications, setCustomNotifications] = useState<Notification[]>([]);
  const reduxNotifications = useAppSelector(state => state.ui.notifications);
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([]);
  
  // Track connection error count
  const connectionErrorCountRef = useRef(0);
  const lastConnectionErrorMessageRef = useRef('');
  const lastConnectionErrorTimeRef = useRef(0);
  
  useEffect(() => {
    setMounted(true);

    // Listen for custom notifications
    const handleNotification = (event: CustomEvent<Notification>) => {
      const notification = event.detail;
      addCustomNotification(notification);
    };

    window.addEventListener('synaptic-notification' as any, handleNotification as EventListener);

    return () => {
      window.removeEventListener('synaptic-notification' as any, handleNotification as EventListener);
    };
  }, []);

  // Determine if two messages are similar
  const areSimilarMessages = (msg1: string, msg2: string): boolean => {
    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[0-9]/g, '')
        .replace(/[^\w\s]/g, '')
        .trim();
    };
    
    const normalizedMsg1 = normalize(msg1);
    const normalizedMsg2 = normalize(msg2);
    
    // Require exact match for short messages
    if (normalizedMsg1.length < 10 || normalizedMsg2.length < 10) {
      return normalizedMsg1 === normalizedMsg2;
    }
    
    // Calculate similarity based on common words
    const words1 = new Set(normalizedMsg1.split(/\s+/));
    const words2 = new Set(normalizedMsg2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    
    const similarity = intersection.size / Math.max(words1.size, words2.size);
    
    return similarity > 0.7; // 70% similarity threshold
  };

  // Group notifications
  useEffect(() => {
    // Combine Redux and custom notifications
    const allNotifications = [
      ...reduxNotifications.map(n => ({
        id: n.id,
        title: n.title || '',
        message: n.message,
        type: n.type,
        duration: n.duration || 5000,
        autoClose: n.autoClose !== false,
        timestamp: parseInt(n.id) || Date.now()
      })),
      ...customNotifications.map(n => ({
        ...n,
        timestamp: n.timestamp || Date.now()
      }))
    ];

    const groups: NotificationGroup[] = [];
    let connectionErrorNotifications: Notification[] = [];
    
    allNotifications.forEach(notification => {
      // Check if it's a connection error notification
      if (notification.type === 'error' && 
         (notification.message.includes('unable to connect') || 
          notification.message.includes('server') || 
          notification.message.includes('down'))) {
        
        connectionErrorCountRef.current += 1;
        lastConnectionErrorMessageRef.current = notification.message;
        lastConnectionErrorTimeRef.current = Date.now();
        
        connectionErrorNotifications.push(notification);
        
        dispatch(removeNotification(notification.id));
        
        return;
      }
      
      // Check for similar notifications
      const similarGroupIndex = groups.findIndex(group => 
        group.type === notification.type && 
        areSimilarMessages(group.message, notification.message)
      );
      
      if (similarGroupIndex !== -1) {
        // Update existing group
        const updatedGroups = [...groups];
        const group = updatedGroups[similarGroupIndex];
        
        group.notifications.push(notification);
        group.count = group.notifications.length;
        
        if (notification.timestamp && notification.timestamp > group.timestamp) {
          group.timestamp = notification.timestamp;
        }
        
        setNotificationGroups(updatedGroups);
      } else {
        // Create new group
        groups.push({
          id: notification.id,
          type: notification.type,
          message: notification.message,
          count: 1,
          timestamp: notification.timestamp || Date.now(),
          notifications: [notification]
        });
      }
    });
    
    // Handle connection error notifications
    if (connectionErrorNotifications.length > 0 && connectionErrorCountRef.current > 0) {
      // Show a summary notification after every 5 errors
      if (connectionErrorCountRef.current % 5 === 1) {
        groups.push({
          id: 'connection-error-summary',
          type: 'error',
          message: connectionErrorCountRef.current > 1 
            ? `Server connection failed (${connectionErrorCountRef.current} attempts)` 
            : lastConnectionErrorMessageRef.current,
          count: connectionErrorCountRef.current,
          timestamp: Date.now(),
          notifications: connectionErrorNotifications
        });
      }
      
      // Reset counter when it gets too large
      if (connectionErrorCountRef.current > 100) {
        connectionErrorCountRef.current = 1;
      }
    }
    
    // Sort by timestamp, newest first
    groups.sort((a, b) => b.timestamp - a.timestamp);
    
    setNotificationGroups(groups);
  }, [reduxNotifications, customNotifications, dispatch]);

  // Add a custom notification
  const addCustomNotification = (notification: Notification) => {
    const id = notification.id || Math.random().toString(36).substring(2, 9);
    const newNotification = {
      id,
      title: notification.title || '',
      message: notification.message,
      type: notification.type || 'info',
      duration: notification.duration || 5000,
      autoClose: notification.autoClose !== false,
      timestamp: Date.now()
    };

    setCustomNotifications(prev => [...prev, newNotification]);

    // Auto-close
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeCustomNotification(id);
      }, newNotification.duration);
    }
  };

  // Remove a custom notification
  const removeCustomNotification = (id: string) => {
    setCustomNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Remove a notification group
  const handleRemoveGroup = (groupId: string) => {
    const group = notificationGroups.find(g => g.id === groupId);
    
    if (!group) return;
    
    // Remove all Redux notifications in the group
    group.notifications.forEach(notification => {
      if (reduxNotifications.some(n => n.id === notification.id)) {
        dispatch(removeNotification(notification.id));
      }
    });
    
    // Remove all custom notifications in the group
    const customIds = group.notifications
      .filter(n => customNotifications.some(cn => cn.id === n.id))
      .map(n => n.id);
    
    if (customIds.length > 0) {
      setCustomNotifications(prev => prev.filter(n => !customIds.includes(n.id)));
    }
    
    // Reset connection error count if removing that summary
    if (groupId === 'connection-error-summary') {
      connectionErrorCountRef.current = 0;
    }
    
    setNotificationGroups(prev => prev.filter(g => g.id !== groupId));
  };

  // Get the icon for a notification type
  const getNotificationIcon = (type: 'info' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'info':
        return <Info size={18} className="text-blue-500" />;
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-500" />;
      default:
        return <Info size={18} className="text-blue-500" />;
    }
  };

  if (!mounted) return null;

  // Limit maximum visible notifications
  const maxNotifications = 3;
  const visibleGroups = notificationGroups.slice(0, maxNotifications);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      <AnimatePresence>
        {visibleGroups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="pointer-events-auto"
          >
            <div
              className={`
                px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm bg-background/95 border
                flex items-start gap-3
                ${group.type === 'info' ? 'border-blue-200 dark:border-blue-800' : ''}
                ${group.type === 'success' ? 'border-green-200 dark:border-green-800' : ''}
                ${group.type === 'warning' ? 'border-yellow-200 dark:border-yellow-800' : ''}
                ${group.type === 'error' ? 'border-red-200 dark:border-red-800' : ''}
              `}
            >
              <div className={`
                flex-shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center
                ${group.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                ${group.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' : ''}
                ${group.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}
                ${group.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' : ''}
              `}>
                {getNotificationIcon(group.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <h3 className={`
                      font-medium text-sm
                      ${group.type === 'info' ? 'text-blue-700 dark:text-blue-300' : ''}
                      ${group.type === 'success' ? 'text-green-700 dark:text-green-300' : ''}
                      ${group.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' : ''}
                      ${group.type === 'error' ? 'text-red-700 dark:text-red-300' : ''}
                    `}>
                      {group.notifications[0].title || (
                        group.type === 'info' ? 'Information' :
                        group.type === 'success' ? 'Success' :
                        group.type === 'warning' ? 'Warning' :
                        'Error'
                      )}
                    </h3>
                    
                    {group.count > 1 && (
                      <span className={`
                        inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full
                        ${group.type === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : ''}
                        ${group.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : ''}
                        ${group.type === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' : ''}
                        ${group.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : ''}
                      `}>
                        {group.count}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleRemoveGroup(group.id)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground ml-2 -mt-1 -mr-1 transition-colors"
                    aria-label="Close"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
                
                <p className="text-sm text-foreground/90 mt-0.5 break-words">{group.message}</p>
                
                {group.count > 1 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {group.count} similar notifications
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {notificationGroups.length > maxNotifications && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-3 py-1.5 bg-card/90 backdrop-blur-sm text-xs rounded-md self-end text-foreground/90 border border-border/50 shadow-md pointer-events-auto"
        >
          +{notificationGroups.length - maxNotifications} more
        </motion.div>
      )}
    </div>
  );
}
