// 創建一個記錄最近請求的映射表
const recentRequests = new Map<string, number>();
const THROTTLE_WINDOW = 30000; // 30秒內不重複發送相同請求

// 檢查是否應該節流請求
export function shouldThrottleRequest(endpoint: string, params?: any): boolean {
  const key = generateRequestKey(endpoint, params);
  const now = Date.now();
  const lastRequest = recentRequests.get(key) || 0;
  
  // 如果該請求在節流窗口內已經發送過，則節流
  if (now - lastRequest < THROTTLE_WINDOW) {
    console.log(`Throttling request to ${endpoint}, last request was ${(now - lastRequest)/1000}s ago`);
    return true;
  }
  
  // 記錄本次請求時間
  recentRequests.set(key, now);
  return false;
}

// 生成請求的唯一鍵
function generateRequestKey(endpoint: string, params?: any): string {
  if (!params) return endpoint;
  
  // 如果params是字符串，直接返回
  if (typeof params === 'string') return `${endpoint}?${params}`;
  
  // 如果params是對象，將其轉換為查詢字符串
  try {
    return `${endpoint}?${new URLSearchParams(params).toString()}`;
  } catch (e) {
    // 如果無法轉換，則使用JSON字符串
    return `${endpoint}?${JSON.stringify(params)}`;
  }
}

// 清除過期的請求記錄
export function cleanupRequestCache() {
  const now = Date.now();
  
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > THROTTLE_WINDOW) {
      recentRequests.delete(key);
    }
  }
}

// 設置定期清理
if (typeof window !== 'undefined') {
  setInterval(cleanupRequestCache, THROTTLE_WINDOW);
}
