import { Message, ChatOptions, Conversation } from '@/types';
import { globalRetryState } from '@/lib/utils/functions';

// 使用绝对URL，避免跨域问题
const WS_BASE_URL = 'ws://127.0.0.1:8001';

// 查找并连接到后端 WebSocket 端点
const createWebSocketUrl = (userId: string, conversationId?: string, token?: string | null): string => {
  let wsUrl = `${WS_BASE_URL}/ws/chat/ws?user_id=${userId}`;
  
  if (conversationId) {
    wsUrl += `&conversation_id=${conversationId}`;
  }
  
  if (token) {
    wsUrl += `&token=${token}`;
  }
  
  return wsUrl;
};

// 获取存储的访问令牌
const getAccessToken = (): string | null => {
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

interface ChatEventCallbacks {
  onMessage?: (message: Message) => void;
  onThinking?: (message: Message) => void;
  onError?: (error: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onConversationCreated?: (conversation: Conversation) => void;
}

class ChatWebSocketClient {
  private socket: WebSocket | null = null;
  private callbacks: ChatEventCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;  // 减少最大重试次数
  private initialReconnectDelay = 5000;  // 初始重连延迟5秒
  private maxReconnectDelay = 30000;  // 减少最大重连延迟时间
  private userId: string | null = null;
  private conversationId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  connect(userId: string, conversationId?: string) {
    this.userId = userId;
    this.conversationId = conversationId || null;
    
    try {
      const token = getAccessToken();
      const wsUrl = createWebSocketUrl(userId, conversationId, token);
      
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
      
      return this.socket;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError({
          message: `Failed to connect to chat server: ${error}`,
          message_type: 'error'
        });
      }
      return null;
    }
  }
  
  setCallbacks(callbacks: ChatEventCallbacks) {
    this.callbacks = callbacks;
  }
  
  // 发送消息
  sendMessage(query: string, options: ChatOptions = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    const message = {
      query,
      options: {
        ...options,
        conversation_id: options.conversation_id || this.conversationId
      }
    };
    
    this.socket.send(JSON.stringify(message));
  }
  
  // 创建新会话
  createConversation(userId: string, title?: string): Promise<Conversation> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        try {
          this.connect(userId);
        } catch (error) {
          return reject(new Error(`Failed to connect to chat server: ${error}`));
        }
      }
      
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'));
      }
      
      // 设置一次性消息处理器来处理创建会话响应
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.message_type === 'conversation_created' || 
              (data.type === 'response' && data.action === 'create_conversation') ||
              (data.conversation_id && data.title)) {
            
            // 清理监听器
            this.socket?.removeEventListener('message', messageHandler);
            clearTimeout(timeoutId);
            
            // 确保ID字段存在
            if (data.conversation) {
              data.conversation.id = data.conversation._id || data.conversation.id;
              
              if (this.callbacks.onConversationCreated) {
                this.callbacks.onConversationCreated(data.conversation);
              }
              
              resolve(data.conversation);
            } else if (data.id) {
              // 后端可能直接返回会话对象
              const conversation = {
                id: data._id || data.id,
                title: data.title || title || 'New Conversation',
                user_id: userId,
                created_at: data.created_at || new Date().toISOString(),
                updated_at: data.updated_at || new Date().toISOString()
              };
              
              if (this.callbacks.onConversationCreated) {
                this.callbacks.onConversationCreated(conversation);
              }
              
              resolve(conversation);
            } else {
              reject(new Error('Invalid response format from server'));
            }
          } else if (data.message_type === 'error') {
            // 清理监听器
            this.socket?.removeEventListener('message', messageHandler);
            clearTimeout(timeoutId);
            
            reject(new Error(data.message || 'Failed to create conversation'));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      // 添加临时消息处理器
      this.socket.addEventListener('message', messageHandler);
      
      // 创建超时处理 - 增加超时时间
      const timeoutId = setTimeout(() => {
        this.socket?.removeEventListener('message', messageHandler);
        reject(new Error('Create conversation timeout - server may be unavailable'));
      }, 15000);
      
      // 发送创建会话请求
      const createRequest = {
        query: JSON.stringify({
          action: 'create_conversation',
          user_id: userId,
          title: title || 'New Conversation'
        })
      };
      
      this.socket.send(JSON.stringify(createRequest));
    });
  }
  
  private setupEventListeners() {
    if (!this.socket) return;
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // 设置心跳检测
      this.startHeartbeat();
      
      if (this.callbacks.onConnected) {
        this.callbacks.onConnected();
      }
    };
    
    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      this.stopHeartbeat();
      
      if (this.callbacks.onDisconnected) {
        this.callbacks.onDisconnected();
      }
      
      // 自动重连
      if (!event.wasClean) {
        this.reconnect();
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError({
          message: 'WebSocket connection error',
          message_type: 'error'
        });
      }
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 处理心跳响应
        if (data.message_type === 'heartbeat' || data.type === 'heartbeat') {
          // 收到心跳响应，不需要额外处理
          return;
        }
        
        // 处理思考中消息
        if (data.message_type === 'thinking') {
          if (this.callbacks.onThinking) {
            this.callbacks.onThinking(data);
          }
          return;
        }
        
        // 处理错误消息
        if (data.message_type === 'error') {
          if (this.callbacks.onError) {
            this.callbacks.onError(data);
          }
          return;
        }
        
        // 处理正常消息
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };
  }
  
  private startHeartbeat() {
    // 每30秒发送一次心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ 
          type: 'heartbeat', 
          timestamp: new Date().toISOString() 
        }));
      }
    }, 30000);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  reconnect() {
    // 如果服务器已知不可用，不进行重连
    if (globalRetryState && globalRetryState.connectionFailed) {
      console.log(`Skipping WebSocket reconnection due to known server issues.`);
      return;
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      
      // 简化重连逻辑，使用更长的固定延迟
      let delay = this.initialReconnectDelay * this.reconnectAttempts;
      
      // 通知用户
      if (typeof window !== 'undefined' && (window as any).__store) {
        (window as any).__store.dispatch({
          type: 'ui/addNotification',
          payload: {
            type: 'warning',
            message: `WebSocket connection issue detected. ${this.reconnectAttempts === this.maxReconnectAttempts ? 'Final attempt' : 'Retrying'} in ${Math.round(delay/1000)} seconds.`,
            autoClose: true,
            duration: 5000
          }
        });
      }
      
      console.log(`WebSocket reconnecting in ${Math.round(delay/1000)} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // 使用单个计时器，减少并发连接尝试
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect(this.userId!, this.conversationId || undefined);
      }, delay);
      
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      
      // 设置全局状态，避免其他组件尝试连接
      if (globalRetryState) {
        globalRetryState.connectionFailed = true;
        globalRetryState.backendDownSince = Date.now();
      }
      
      // 可以在这里触发一个事件，通知应用程序重连失败
      if (this.callbacks.onError) {
        this.callbacks.onError({
          message: `Failed to reconnect after ${this.maxReconnectAttempts} attempts.`,
          message_type: 'error'
        });
      }
      
      // 通知用户
      if (typeof window !== 'undefined' && (window as any).__store) {
        (window as any).__store.dispatch({
          type: 'ui/addNotification',
          payload: {
            type: 'error',
            message: `Cannot connect to chat server. Please refresh the page when the server is available.`,
            autoClose: false
          }
        });
      }
    }
  }
  
  disconnect() {
    this.stopHeartbeat();
    
    if (this.socket) {
      // 只有在连接状态才需要关闭
      if (this.socket.readyState === WebSocket.OPEN || 
          this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }
    
    this.userId = null;
    this.conversationId = null;
  }
  
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // 获取当前对话 ID
  getConversationId(): string | null {
    return this.conversationId;
  }

  // 获取当前重连尝试次数
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
  
  // 获取当前回调
  getCallbacks(): ChatEventCallbacks {
    return this.callbacks;
  }
}

// 创建单例实例
const chatWebSocketClient = new ChatWebSocketClient();

export default chatWebSocketClient;
