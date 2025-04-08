'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks';
import { addNotification, removeNotification } from '@/store/slices/uiSlice';
import { globalRetryState } from '@/lib/utils/functions';

// 服務狀態監控器，用於顯示後端服務狀態變化通知
export function ServiceStatusMonitor() {
  const dispatch = useAppDispatch();
  
  // 維護一個服務狀態監控，用於顯示適當的通知
  useEffect(() => {
    let lastStatus = {
      api: true,
      connectionFailed: false,
      notificationId: ''
    };
    
    const checkStatusInterval = setInterval(() => {
      const currentConnectionFailed = globalRetryState.connectionFailed;
      const currentApiStatus = globalRetryState.serviceStatus?.api || false;
      
      // 如果狀態從正常變為失敗
      if (!lastStatus.connectionFailed && currentConnectionFailed) {
        // 服務剛斷開，顯示通知
        const downTime = globalRetryState.backendDownSince 
          ? Math.round((Date.now() - globalRetryState.backendDownSince) / 1000)
          : 0;
        
        // 顯示新通知並儲存ID
        const notificationId = Date.now().toString();
        dispatch(addNotification({
          type: 'error',
          message: `無法連接到後端服務。系統將在背景繼續嘗試連接。`,
          autoClose: false,
          duration: 0 // 不自動關閉
        }));
        
        // 更新狀態
        lastStatus = {
          api: currentApiStatus,
          connectionFailed: currentConnectionFailed,
          notificationId
        };
      } 
      // 如果狀態從失敗變為正常
      else if (lastStatus.connectionFailed && !currentConnectionFailed) {
        // 服務恢復，顯示成功通知
        if (lastStatus.notificationId) {
          // 先移除持久的錯誤通知
          dispatch(removeNotification(lastStatus.notificationId));
        }
        
        // 顯示成功通知
        dispatch(addNotification({
          type: 'success',
          message: '後端服務連接已恢復。',
          autoClose: true,
          duration: 5000
        }));
        
        // 更新狀態
        lastStatus = {
          api: currentApiStatus,
          connectionFailed: currentConnectionFailed,
          notificationId: ''
        };
      }
      // 如果連續失敗超過 2 分鐘，更新通知
      else if (currentConnectionFailed && globalRetryState.backendDownSince) {
        const downTime = Math.round((Date.now() - globalRetryState.backendDownSince) / 1000);
        
        // 每 30 秒更新一次通知
        if (downTime % 30 === 0 && downTime > 60) {
          if (lastStatus.notificationId) {
            // 移除舊通知
            dispatch(removeNotification(lastStatus.notificationId));
          }
          
          // 顯示更新的通知
          const notificationId = Date.now().toString();
          dispatch(addNotification({
            type: 'error',
            message: `後端服務已斷開 ${Math.floor(downTime / 60)} 分 ${downTime % 60} 秒。重新連接嘗試將在背景繼續進行。`,
            autoClose: false,
            duration: 0 // 不自動關閉
          }));
          
          // 更新通知ID
          lastStatus.notificationId = notificationId;
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(checkStatusInterval);
    };
  }, [dispatch]);
  
  // 這是一個監控組件，不需要渲染任何UI
  return null;
}

export default ServiceStatusMonitor;
