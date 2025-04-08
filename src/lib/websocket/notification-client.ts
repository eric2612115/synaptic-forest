import { io, Socket } from 'socket.io-client';
import { globalRetryState } from '@/lib/utils/functions';

const WS_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
  : '';

// 獲取存儲的訪問令牌
const getAccessToken = (): string | null => {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

interface NotificationEventCallbacks {
  onKnowledgeExtractionComplete?: (data: any) => void;
  onReflectionCycleUpdate?: (data: any) => void;
  onCrossLinkDetected?: (data: any) => void;
  onSystemAlert?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

class NotificationWebSocketClient {
  private socket: Socket | null = null;
  private callbacks: NotificationEventCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private initialReconnectDelay = 5000;  // 初始重連延遲到5秒
  private maxReconnectDelay = 60000;  // 最大重連延遲時間為60秒
  private userId: string | null = null;

  connect(userId: string) {
    this.userId = userId;
    let url = `${WS_BASE_URL}/ws/notifications?user_id=${userId}`;
    
    // 添加訪問令牌（如果有）
    const token = getAccessToken();
    if (token) {
      url += `&token=${token}`;
    }
    
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: this.initialReconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000, // 連接超時設為20秒
      randomizationFactor: 0.5, // 增加隨機因子降低多客戶端同時重連的可能性
      withCredentials: true // 允許跨域請求攜帶 cookies
    });
    
    this.setupEventListeners();
    
    return this.socket;
  }
  
  setCallbacks(callbacks: NotificationEventCallbacks) {
    this.callbacks = callbacks;
  }
  
  private setupEventListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Notification WebSocket connected');
      this.reconnectAttempts = 0;
      if (this.callbacks.onConnected) {
        this.callbacks.onConnected();
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('Notification WebSocket disconnected');
      if (this.callbacks.onDisconnected) {
        this.callbacks.onDisconnected();
      }
    });
    
    this.socket.on('notification', (data: any) => {
      switch (data.type) {
        case 'knowledge_extraction_complete':
          if (this.callbacks.onKnowledgeExtractionComplete) {
            this.callbacks.onKnowledgeExtractionComplete(data);
          }
          break;
        case 'reflection_cycle_update':
          if (this.callbacks.onReflectionCycleUpdate) {
            this.callbacks.onReflectionCycleUpdate(data);
          }
          break;
        case 'cross_link_detected':
          if (this.callbacks.onCrossLinkDetected) {
            this.callbacks.onCrossLinkDetected(data);
          }
          break;
        case 'system_alert':
          if (this.callbacks.onSystemAlert) {
            this.callbacks.onSystemAlert(data);
          }
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    });
    
    this.socket.on('error', (error: any) => {
      console.error('Notification WebSocket error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });
    
    this.socket.on('reconnect_attempt', (attempt: number) => {
      console.log(`Notification reconnect attempt ${attempt}`);
      this.reconnectAttempts = attempt;
    });
    
    this.socket.on('reconnect_failed', () => {
      console.error('Notification WebSocket reconnection failed');
    });
  }
  
  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      
      // 如果前幾次重新連接都失敗了，大幅增加等待時間
      const isFrequentFailure = this.reconnectAttempts >= 3;
      
      // 計算重連延遲，使用指數退避策略
      let delay = Math.min(
        this.maxReconnectDelay,
        this.initialReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1)
      );
      
      // 如果已經失敗多次，大幅延長等待時間
      if (isFrequentFailure) {
        delay = Math.max(delay, 30000); // 至少等待 30 秒
      }
      
      // 添加一些隨機性以避免多個客戶端同時重連
      const jitter = delay * 0.2 * Math.random();
      const finalDelay = delay + jitter;
      
      console.log(`Notification WebSocket reconnecting in ${Math.round(finalDelay/1000)} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        // 重連前再次檢查重連狀態
        if (globalRetryState && globalRetryState.connectionFailed) {
          // 如果 API 已經報告連接問題，延遲重連
          console.log(`Delaying notification reconnection due to known server connection issues.`);
          this.reconnectAttempts--; // 避免計數增加
          // 在 30 秒後再次嘗試
          setTimeout(() => this.reconnect(), 30000);
          return;
        }
        
        console.log(`Attempting to reconnect notifications (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect(this.userId!);
      }, finalDelay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum notification reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      // 我們不為通知客戶端顯示連接失敗的通知，因為這不是關鍵功能
    }
  }
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
  }
  
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// 創建單例實例
const notificationWebSocketClient = new NotificationWebSocketClient();

export default notificationWebSocketClient;
