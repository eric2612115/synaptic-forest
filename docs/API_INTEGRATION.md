# API 集成文檔

本文檔提供了 Synaptic Forest 前端如何與後端 API 和 WebSocket 服務集成的詳細說明。

## 基本配置

- **基礎URL**: `http://<server_host>:8001`
- **WebSocket URL**: `ws://<server_host>:8001/ws/chat/ws`
- **認證方式**: JWT Token

## 認證流程

### 1. 登入獲取Token

**請求**:
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "your_password"
}
```

**響應**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user123",
    "username": "user123",
    "email": "user@example.com"
  }
}
```

### 2. 使用Token進行認證

在所有需要認證的請求中，添加以下頭部:
```
Authorization: Bearer <your_access_token>
```

## REST API 端點

### 會話管理

#### 創建新會話

```typescript
// 在 api-client.ts 中實現
async function createConversation(userId: string, title?: string): Promise<Conversation> {
  const response = await axios.post('/api/public/conversations/', {
    user_id: userId,
    title: title || 'New Conversation'
  });
  
  return response.data;
}
```

#### 獲取用戶會話列表

```typescript
async function getUserConversations(
  userId: string, 
  limit = 10, 
  skip = 0
): Promise<{ conversations: Conversation[], total: number }> {
  const response = await axios.get(
    `/api/public/conversations/user/${userId}?limit=${limit}&skip=${skip}`
  );
  
  return response.data;
}
```

#### 獲取會話詳情

```typescript
async function getConversation(
  conversationId: string, 
  includeMessages = true
): Promise<ConversationDetails> {
  const response = await axios.get(
    `/api/public/conversations/${conversationId}?include_messages=${includeMessages}`
  );
  
  return response.data;
}
```

### 知識圖譜操作

#### 獲取知識圖譜

```typescript
async function getKnowledgeGraph(
  userId: string,
  topicClusterId?: string,
  includeDormant = false
): Promise<KnowledgeGraph> {
  const params = new URLSearchParams({
    user_id: userId,
    include_dormant: String(includeDormant)
  });
  
  if (topicClusterId) {
    params.append('topic_cluster_id', topicClusterId);
  }
  
  const response = await axios.get(`/api/public/knowledge/graph?${params.toString()}`);
  return response.data;
}
```

#### 檢索節點詳情

```typescript
async function getNodeDetails(
  nodeId: string,
  userId: string,
  includeNeighbors = false
): Promise<NodeDetails> {
  const params = new URLSearchParams({
    user_id: userId,
    include_neighbors: String(includeNeighbors)
  });
  
  const response = await axios.get(
    `/api/public/knowledge/node/${nodeId}?${params.toString()}`
  );
  
  return response.data;
}
```

#### 搜索知識

```typescript
async function searchKnowledge(
  userId: string,
  query: string,
  limit = 10,
  minSimilarity = 0.6
): Promise<SearchResults> {
  const params = new URLSearchParams({
    user_id: userId,
    query: query,
    limit: String(limit),
    min_similarity: String(minSimilarity)
  });
  
  const response = await axios.get(`/api/public/knowledge/search?${params.toString()}`);
  return response.data;
}
```

### 反思系統

#### 觸發反思循環

```typescript
async function triggerReflection(
  userId: string,
  energyBudget = 100,
  priorities: string[] = ["connectivity", "depth", "verification"]
): Promise<{ cycle_id: string, status: string, message: string }> {
  const response = await axios.post('/api/reflection/trigger', {
    user_id: userId,
    energy_budget: energyBudget,
    priorities: priorities
  });
  
  return response.data;
}
```

#### 檢查反思循環狀態

```typescript
async function getReflectionStatus(
  cycleId: string,
  userId: string
): Promise<ReflectionCycleStatus> {
  const params = new URLSearchParams({
    user_id: userId
  });
  
  const response = await axios.get(
    `/api/reflection/cycle/${cycleId}?${params.toString()}`
  );
  
  return response.data;
}
```

## WebSocket 集成

### 聊天 WebSocket

#### 連接和消息處理

```typescript
// 在 websocket-client.ts 中實現
import { io, Socket } from 'socket.io-client';

class ChatWebSocketClient {
  private socket: Socket | null = null;
  
  connect(userId: string, conversationId?: string) {
    let url = `${WS_BASE_URL}/ws/chat/ws?user_id=${userId}`;
    
    if (conversationId) {
      url += `&conversation_id=${conversationId}`;
    }
    
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    this.setupEventListeners();
    
    return this.socket;
  }
  
  sendMessage(query: string, options: ChatOptions = {}) {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('message', {
      query,
      options
    });
  }
  
  private setupEventListeners() {
    this.socket?.on('message', (data: any) => {
      // 處理接收到的消息
      if (data.message_type === 'normal') {
        // 處理普通消息
      } else if (data.message_type === 'thinking') {
        // 處理思考過程消息
      } else if (data.message_type === 'error') {
        // 處理錯誤消息
      }
    });
    
    this.socket?.on('heartbeat', () => {
      // 處理心跳消息
      this.socket?.emit('heartbeat', { timestamp: new Date().toISOString() });
    });
  }
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

### 通知 WebSocket

#### 通知處理

```typescript
class NotificationWebSocketClient {
  private socket: Socket | null = null;
  
  connect(userId: string) {
    const url = `${WS_BASE_URL}/ws/notifications?user_id=${userId}`;
    
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    this.setupEventListeners();
    
    return this.socket;
  }
  
  private setupEventListeners() {
    this.socket?.on('notification', (data: any) => {
      switch(data.type) {
        case 'knowledge_extraction_complete':
          // 處理知識提取完成通知
          break;
        case 'reflection_cycle_update':
          // 處理反思循環更新
          break;
        case 'cross_link_detected':
          // 處理連接跨域通知
          break;
      }
    });
  }
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

## 數據流與狀態管理策略

### REST API 數據

推薦使用 React Query 或 SWR 進行 REST API 數據管理:

```typescript
// 使用 React Query 範例
export function useKnowledgeGraph(userId: string, topicClusterId?: string) {
  return useQuery(
    ['knowledgeGraph', userId, topicClusterId],
    () => api.getKnowledgeGraph(userId, topicClusterId),
    {
      staleTime: 60000, // 1分鐘
      refetchOnWindowFocus: false
    }
  );
}
```

### WebSocket 數據

WebSocket 數據應該集成到 Redux 狀態中:

```typescript
// WebSocket 中間件
const websocketMiddleware = (store: any) => {
  let chatClient: ChatWebSocketClient | null = null;
  let notificationClient: NotificationWebSocketClient | null = null;
  
  return (next: any) => (action: any) => {
    switch (action.type) {
      case 'WS_CONNECT_CHAT':
        chatClient = new ChatWebSocketClient();
        chatClient.connect(action.payload.userId, action.payload.conversationId);
        break;
        
      case 'WS_DISCONNECT_CHAT':
        chatClient?.disconnect();
        chatClient = null;
        break;
        
      // 其他 WebSocket 相關 actions...
        
      default:
        break;
    }
    
    return next(action);
  };
};
```

## 錯誤處理

```typescript
// API 錯誤攔截器
axios.interceptors.response.use(
  response => response,
  error => {
    const statusCode = error.response?.status;
    
    if (statusCode === 401) {
      // 處理身份驗證錯誤
      store.dispatch({ type: 'AUTH_LOGOUT' });
    } else if (statusCode === 429) {
      // 處理速率限制
      store.dispatch({ 
        type: 'SHOW_NOTIFICATION', 
        payload: { type: 'error', message: '請求頻率過高，請稍後再試' } 
      });
    }
    
    return Promise.reject(error);
  }
);
```

## WebSocket 重連策略

```typescript
// 指數退避重連
function createExponentialBackoff() {
  let retryCount = 0;
  const maxRetries = 10;
  const baseDelay = 1000;
  
  return {
    reset() {
      retryCount = 0;
    },
    next() {
      if (retryCount >= maxRetries) {
        return null; // 停止重試
      }
      
      const delay = Math.min(
        30000, // 最大 30 秒
        baseDelay * Math.pow(2, retryCount)
      );
      
      retryCount++;
      return delay;
    }
  };
}
```

## 使用提示

1. 所有 API 請求應包含錯誤處理和加載狀態
2. WebSocket 連接應實現重連機制
3. 對於關鍵數據，實現樂觀更新策略
4. 使用 TypeScript 類型保護 API 響應數據