'use client';

import React, { useState, useEffect } from 'react';
import { globalRetryState } from '@/lib/utils/functions';
import { useAppDispatch } from '@/hooks';
import { addNotification } from '@/store/slices/uiSlice';

interface ConnectionStatusProps {
  className?: string;
}

/**
 * 連接狀態指示燈組件
 * 顯示API和WebSocket連接狀態並提供重連選項
 */
export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // 檢查是否有連接問題
      if (globalRetryState.connectionFailed) {
        setStatus('disconnected');
      } else if (globalRetryState.isRetrying) {
        setStatus('reconnecting');
      } else if (globalRetryState.serviceStatus?.api && globalRetryState.serviceStatus?.ws) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
      
      setLastCheckTime(Date.now());
    }, 1000); // 每秒檢查一次
    
    return () => clearInterval(checkInterval);
  }, []);
  
  const handleManualReconnect = () => {
    if (status !== 'reconnecting') {
      // 重置全局重試狀態
      if (globalRetryState.reset) {
        globalRetryState.reset();
      } else {
        // 如果方法不存在就使用這個備用方法
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
      
      // 重新加載頁面是最徹底的重連方式
      window.location.reload();
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {status === 'connected' && (
        <>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-green-500">已連接</span>
        </>
      )}
      
      {status === 'disconnected' && (
        <div className="group relative">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-red-500">未連接</span>
            <button 
              onClick={handleManualReconnect}
              className="text-xs text-primary hover:text-primary/80 flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
              <span>重新連接</span>
            </button>
          </div>
          
          {/* 懸停顯示詳細錯誤信息 */}
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-card border rounded-md shadow-lg p-2 w-48 z-50">
            <div className="text-xs">
              <p className="font-medium mb-1">連接狀態:</p>
              <p>API: {globalRetryState.serviceStatus?.api ? '可用' : '不可用'}</p>
              <p>WebSocket: {globalRetryState.serviceStatus?.ws ? '可用' : '不可用'}</p>
              {globalRetryState.lastConnectionError && (
                <p className="mt-1 text-red-500">{globalRetryState.lastConnectionError}</p>
              )}
              <p className="mt-1 text-muted-foreground">
                重連嘗試: {globalRetryState.reconnectCount || 0} 次
              </p>
            </div>
          </div>
        </div>
      )}
      
      {status === 'reconnecting' && (
        <>
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
          <span className="text-xs text-yellow-500">連接中...</span>
        </>
      )}
    </div>
  );
}
