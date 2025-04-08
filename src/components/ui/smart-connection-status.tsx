'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { globalRetryState } from '@/lib/utils/functions';
import { useAppDispatch } from '@/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import chatWebSocketClient from '@/lib/websocket/chat-client';
import notificationWebSocketClient from '@/lib/websocket/notification-client';

interface SmartConnectionStatusProps {
  className?: string;
}

/**
 * 智能連接狀態指示燈組件
 * 根據當前頁面需求智能顯示API和WebSocket連接狀態
 */
export function SmartConnectionStatus({ className = '' }: SmartConnectionStatusProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnecting' | 'partial'>('connected');
  const [statusText, setStatusText] = useState('已連接');
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  
  // 判斷當前頁面是否需要特定的連接
  const needsApi = true; // 所有頁面都需要API
  const needsChat = pathname.includes('/conversation'); // 聊天頁面需要聊天WebSocket
  const needsNotifications = pathname.includes('/dashboard') || pathname.includes('/forest'); // 這些頁面需要通知WebSocket
  
  // 無論是哪個頁面，底層API連接失敗都將導致連接狀態為失敗
  // 但首頁、登錄頁等不需要即時連接，可以不顯示連接狀態指示器
  const requiresConnection = !(pathname === '/' || pathname.includes('/login') || pathname.includes('/register'));
  
  // 如果是不需要顯示連接狀態的頁面，直接返回null
  if (!requiresConnection) {
    return null;
  }
  
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // 獲取連接狀態
      const apiConnected = globalRetryState.serviceStatus?.api || false;
      const chatConnected = needsChat ? chatWebSocketClient.isConnected() : true;
      const notificationsConnected = needsNotifications ? notificationWebSocketClient.isConnected() : true;
      
      // 如果API已知完全失敗
      if (globalRetryState.connectionFailed) {
        setStatus('disconnected');
        
        // 根據故障時間更新顯示文本
        const downTime = (globalRetryState.backendDownSince > 0) 
          ? Math.floor((Date.now() - globalRetryState.backendDownSince) / 60000) 
          : 0;
          
        setStatusText(downTime > 0 
          ? `伺服器已斷線${downTime}分鐘` 
          : '伺服器已斷線');
      } 
      // 如果正在重試連接
      else if (globalRetryState.isRetrying) {
        setStatus('reconnecting');
        setStatusText('重新連接中...');
      }
      // 檢查當前頁面需要的所有連接
      else if (needsApi && !apiConnected) {
        setStatus('disconnected');
        setStatusText('API未連接');
      }
      else if (needsChat && !chatConnected) {
        setStatus(apiConnected ? 'partial' : 'disconnected');
        setStatusText('聊天未連接');
      }
      else if (needsNotifications && !notificationsConnected) {
        setStatus(apiConnected ? 'partial' : 'disconnected');
        setStatusText('通知未連接');
      }
      // 所有需要的服務都已連接
      else {
        setStatus('connected');
        setStatusText('已連接');
      }
      
      setLastCheckTime(Date.now());
    }, 1000); // 每秒檢查一次
    
    return () => clearInterval(checkInterval);
  }, [pathname, needsApi, needsChat, needsNotifications]);
  
  const handleManualReconnect = () => {
    if (status !== 'reconnecting') {
      // 重置全局重試狀態
      if (globalRetryState.reset) {
        globalRetryState.reset();
      } else {
        globalRetryState.connectionFailed = false;
        globalRetryState.isRetrying = false;
        globalRetryState.failedEndpoints.clear();
        if (globalRetryState.serviceStatus) {
          globalRetryState.serviceStatus.api = true;
          globalRetryState.serviceStatus.ws = true;
        }
      }
      
      // 通知用戶重連嘗試
      dispatch(addNotification({
        type: 'info',
        message: '正在嘗試重新連接...',
        autoClose: true,
        duration: 3000
      }));
      
      // 嘗試重新連接 WebSockets
      if (needsChat && !chatWebSocketClient.isConnected()) {
        const userId = localStorage.getItem('username') || 'user123';
        chatWebSocketClient.connect(userId);
      }
      
      if (needsNotifications && !notificationWebSocketClient.isConnected()) {
        const userId = localStorage.getItem('username') || 'user123';
        notificationWebSocketClient.connect(userId);
      }
      
      // 如果主要API已經斷開連接較長時間，刷新頁面可能是最有效的方法
      if (globalRetryState.connectionFailed && globalRetryState.backendDownSince &&
          (Date.now() - globalRetryState.backendDownSince) > 60000) {
        // 1分鐘後才考慮重新載入頁面
        window.location.reload();
      }
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {status === 'connected' && (
        <>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-green-500">{statusText}</span>
        </>
      )}
      
      {status === 'partial' && (
        <div className="group relative">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-yellow-500">{statusText}</span>
            <button 
              onClick={handleManualReconnect}
              className="text-xs text-primary hover:text-primary/80 flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
              <span>重連</span>
            </button>
          </div>
          
          {/* 懸停顯示詳細錯誤信息 */}
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-card border rounded-md shadow-lg p-2 w-48 z-50">
            <div className="text-xs">
              <p className="font-medium mb-1">連接狀態:</p>
              <p>API: {globalRetryState.serviceStatus?.api ? '可用' : '不可用'}</p>
              <p>聊天: {needsChat ? (chatWebSocketClient.isConnected() ? '可用' : '不可用') : '不需要'}</p>
              <p>通知: {needsNotifications ? (notificationWebSocketClient.isConnected() ? '可用' : '不可用') : '不需要'}</p>
              {globalRetryState.lastConnectionError && (
                <p className="mt-1 text-red-500">{globalRetryState.lastConnectionError}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {status === 'disconnected' && (
        <div className="group relative">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-red-500">{statusText}</span>
            <button 
              onClick={handleManualReconnect}
              className="text-xs text-primary hover:text-primary/80 flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
              <span>重連</span>
            </button>
          </div>
          
          {/* 懸停顯示詳細錯誤信息 */}
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-card border rounded-md shadow-lg p-2 w-52 z-50">
            <div className="text-xs">
              <p className="font-medium mb-1">連接狀態:</p>
              <p>API: {globalRetryState.serviceStatus?.api ? '可用' : '不可用'}</p>
              <p>聊天: {needsChat ? (chatWebSocketClient.isConnected() ? '可用' : '不可用') : '不需要'}</p>
              <p>通知: {needsNotifications ? (notificationWebSocketClient.isConnected() ? '可用' : '不可用') : '不需要'}</p>
              {globalRetryState.lastConnectionError && (
                <p className="mt-1 text-red-500 break-words text-[10px]">{globalRetryState.lastConnectionError}</p>
              )}
              <p className="mt-1 text-muted-foreground">
                重連嘗試: {globalRetryState.reconnectCount || 0} 次
              </p>
              {globalRetryState.backendDownSince > 0 && (
                <p className="mt-1 text-muted-foreground">
                  故障時間: {Math.round((Date.now() - globalRetryState.backendDownSince) / 1000 / 60)} 分鐘
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {status === 'reconnecting' && (
        <>
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
          <span className="text-xs text-yellow-500">{statusText}</span>
        </>
      )}
    </div>
  );
}

export default SmartConnectionStatus;
