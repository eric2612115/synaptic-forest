/**
 * 工具函數集合
 */

/**
 * 休眠指定的毫秒數
 * @param ms 休眠時間（毫秒）
 * @returns Promise
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 指數退避函數生成器
 * 生成一個指數退避函數，用於 API 重試
 * @param initialDelay 初始延遲時間（毫秒）
 * @param maxDelay 最大延遲時間（毫秒）
 * @param factor 退避因子
 * @returns 退避函數，返回下一次延遲時間（毫秒）
 */
export const createExponentialBackoff = (
  initialDelay = 5000,
  maxDelay = 60000,
  factor = 2
) => {
  let retryCount = 0;
  
  return {
    reset: () => {
      retryCount = 0;
    },
    next: () => {
      const delay = Math.min(
        maxDelay,
        initialDelay * Math.pow(factor, retryCount)
      );
      retryCount++;
      return delay;
    }
  };
};

/**
 * 帶重試的 API 調用包裝器
 * @param apiCall API 調用函數
 * @param maxRetries 最大重試次數
 * @param initialDelay 初始延遲時間（毫秒）
 * @param maxDelay 最大延遲時間（毫秒）
 * @returns API 調用結果
 */

// 全局重試狀態追蹤
export const globalRetryState = {
  isRetrying: false,
  isPolling: false,       // 是否正在輪詢
  lastPollingTime: 0,    // 上次輪詢的時間戳
  connectionFailed: false,
  lastRetryTime: 0,
  failedEndpoints: new Set<string>(),
  serviceStatus: {
    api: true,  // API 服務狀態
    ws: true   // WebSocket 服務狀態
  },
  reconnectCount: 0,  // 重連總次數
  lastConnectionError: "", // 最後連接錯誤信息
  pollingInterval: 30000, // 預設輪詢間隔為 30 秒
  errorNotified: false,   // 是否已顯示錯誤通知
  backendDownSince: 0,    // 後端服務故障開始時間
  consecutiveErrors: 0,   // 連續錯誤次數
  
  // 重置重試計數和狀態
  reset: function() {
    this.isRetrying = false;
    this.isPolling = false;
    this.connectionFailed = false;
    this.failedEndpoints.clear();
    this.serviceStatus.api = true;
    this.serviceStatus.ws = true;
    this.reconnectCount = 0;
    this.lastConnectionError = "";
    this.errorNotified = false;
    this.backendDownSince = 0;
    this.consecutiveErrors = 0;
  },
  
  // 記錄連接失敗
  setConnectionFailed: function(error: any, endpoint?: string) {
    const now = Date.now();
    this.connectionFailed = true;
    this.lastRetryTime = now;
    this.reconnectCount++;
    this.serviceStatus.api = false;
    this.consecutiveErrors++;
    
    // 記錄後端服務故障開始時間
    if (this.backendDownSince === 0) {
      this.backendDownSince = now;
    }
    
    if (endpoint) {
      this.failedEndpoints.add(endpoint);
    }
    
    if (error) {
      this.lastConnectionError = 
        error.message || error.code || 'Connection failed';
    }
    
    // 限制錯誤通知频率，避免重複彈出
    const errorNotifyThreshold = 5; // 5次連續錯誤才顯示通知
    if (!this.errorNotified || this.consecutiveErrors >= errorNotifyThreshold) {
      this.errorNotified = true;
      this.consecutiveErrors = 0; // 重置計數
    }
  },
  
  // 設置輪詢間隔
  setPollingInterval: function(interval: number) {
    if (interval >= 5000) { // 最小間隔 5 秒
      this.pollingInterval = interval;
    }
  }
};

export async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 5000,
  maxDelay = 60000,
  endpoint?: string
): Promise<T> {
  const backoff = createExponentialBackoff(initialDelay, maxDelay);
  let lastError: any;
  
  // 獲取當前時間
  const now = Date.now();
  
  // 如果服務已知宕機，根據宕機時間決定是否與如何重試
  if (globalRetryState.connectionFailed) {
    const downTime = now - globalRetryState.backendDownSince;
    const sinceLastTry = now - globalRetryState.lastRetryTime;
    
    // 計算適當的重試間隔
    // 階梯式增加重試間隔
    let retryThreshold;
    
    if (downTime < 60000) { // 小於 1 分鐘
      retryThreshold = 10000; // 10 秒
    } else if (downTime < 300000) { // 1-5 分鐘
      retryThreshold = 30000; // 30 秒
    } else if (downTime < 900000) { // 5-15 分鐘
      retryThreshold = 60000; // 1 分鐘
    } else if (downTime < 3600000) { // 15-60 分鐘
      retryThreshold = 120000; // 2 分鐘
    } else { // 超過 1 小時
      retryThreshold = 300000; // 5 分鐘
    }
    
    // 如果距離上次嘗試時間小於開值，直接返回錯誤避免重複嘗試
    if (sinceLastTry < retryThreshold) {
      console.warn(`Backend service has been down for ${Math.round(downTime/1000)}s. `+
                 `Last attempt was ${Math.round(sinceLastTry/1000)}s ago. `+
                 `Will retry after ${Math.round((retryThreshold-sinceLastTry)/1000)}s.`);
      
      // 返回特定錯誤以避免频繁重試
      return Promise.reject({
        message: 'Backend service is currently unavailable, retry scheduled.',
        code: 'SERVICE_UNAVAILABLE',
        retryAfter: Math.round((retryThreshold-sinceLastTry)/1000)
      });
    }
    
    // 允許此次重試，但增加重試間隔
    console.log(`Backend has been down for ${Math.round(downTime/1000)}s, but threshold reached. Allowing retry attempt.`);
    initialDelay = Math.max(initialDelay, Math.min(downTime / 10, maxDelay));
  }
  
  // 記錄端點失敗
  if (endpoint && globalRetryState.failedEndpoints.has(endpoint)) {
    const now = Date.now();
    const downTime = globalRetryState.backendDownSince ? now - globalRetryState.backendDownSince : 0;
    
    // 如果已經知道這個端點失敗，且服務已經宕機超過 1 分鐘，大幅延長重試間隔
    if (downTime > 60000) {
      console.warn(`Endpoint ${endpoint} has been failing for ${Math.round(downTime/1000)}s. Increasing retry interval.`);
      // 增加重試間隔，每 1 分鐘增加 30 秒，最多 5 分鐘
      const extraDelay = Math.min(300000, Math.floor(downTime / 60000) * 30000);
      initialDelay = Math.min(maxDelay, initialDelay + extraDelay);
    }
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 首次嘗試不延遲，重試時才延遲
      if (attempt > 0) {
        if (globalRetryState.isRetrying) {
          // 如果某個請求正在重試中，增加延遲以避免併發
          await sleep(1000 * attempt); // 按照嘗試次數累加延遲
        }
        
        globalRetryState.isRetrying = true;
        globalRetryState.lastRetryTime = Date.now();
        
        const delay = backoff.next();
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
        await sleep(delay);
      }
      
      const result = await apiCall();
      
      // 成功後重置相關狀態
      globalRetryState.isRetrying = false;
      globalRetryState.connectionFailed = false;
      globalRetryState.serviceStatus.api = true;
      globalRetryState.backendDownSince = 0;
      globalRetryState.errorNotified = false;
      globalRetryState.consecutiveErrors = 0;
      
      if (endpoint) {
        globalRetryState.failedEndpoints.delete(endpoint);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // 特殊處理連接被拒絕的情況 (ECONNREFUSED)
      if (error.code === 'ECONNREFUSED' || error.syscall === 'connect' || 
          error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        console.warn(`Backend connection failed for ${Math.round(downTime/1000)} seconds. Next retry in ${retryDelay/1000} seconds.`);
        await sleep(retryDelay);
        
        // 控制通知频率 - 如果已經顯示過通知，且連續錯誤次數不足閾值，則不顯示
        const notificationThreshold = Math.min(5, 1 + Math.floor(downTime / 300000)); // 每 5 分鐘增加一次通知閾值，最多 5 次
        const shouldNotify = !globalRetryState.errorNotified || globalRetryState.consecutiveErrors >= notificationThreshold;
        
        if (shouldNotify) {
          // 通知用戶
          if (typeof window !== 'undefined' && (window as any).__store) {
            (window as any).__store.dispatch({
              type: 'ui/addNotification',
              payload: {
                type: 'error',
                message: downTime > 180000 ?
                  `伺服器已經宕機 ${Math.round(downTime/60000)} 分鐘。重試將在背景進行。` :
                  '無法連接到伺服器，請確認伺服器是否運行中。重試將在背景進行。',
                autoClose: true,
                duration: 8000
              }
            });
            globalRetryState.errorNotified = true;
            globalRetryState.consecutiveErrors = 0; // 重置計數
          }
        } else {
          console.log('Skipping error notification to avoid spam');
        }
        
        // 如果失敗時間超過 30 分鐘，且重試次數超過 10 次，則考慮放棄
        if (downTime > 1800000 && globalRetryState.reconnectCount > 10) { // 30 分鐘
          throw new Error(`Backend service unavailable for ${Math.round(downTime/60000)} minutes. Please check server status.`);
        }
      }
      
      // 如果是 rate limit 錯誤 (429)，或者是網絡錯誤，則進行重試
      if (
        error.response?.status === 429 || 
        !error.response ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNREFUSED'
      ) {
        console.warn(`API call failed (${error.response?.status || error.code || 'Network Error'}), will retry`);
        continue;
      }
      
      // 如果是其他錯誤，則直接拋出
      globalRetryState.isRetrying = false;
      throw error;
    }
  }
  
  // 如果所有重試都失敗，則拋出最後一個錯誤
  console.error(`All ${maxRetries} retry attempts failed`);
  globalRetryState.isRetrying = false;
  throw lastError;
}
