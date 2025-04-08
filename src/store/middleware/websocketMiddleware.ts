import { Middleware } from 'redux';
import chatWebSocketClient from '@/lib/websocket/chat-client';
import notificationWebSocketClient from '@/lib/websocket/notification-client';
import { 
  addMessage, 
  updateThinkingContent 
} from '../slices/conversationSlice';
import { 
  addNode, 
  addEdge 
} from '../slices/knowledgeGraphSlice';
import { 
  updateCycleStatus 
} from '../slices/reflectionSlice';
import { 
  updateEnergyStatus, 
  updateSystemHealth 
} from '../slices/systemSlice';
import { 
  addNotification 
} from '../slices/uiSlice';
import { Message, KnowledgeNode, KnowledgeEdge, ReflectionCycleStatus } from '@/types';

// WebSocket 相關的 action 類型
interface WebSocketConnectChatAction {
  type: 'WS_CONNECT_CHAT';
  payload: {
    userId: string;
    conversationId?: string;
  };
}

interface WebSocketDisconnectChatAction {
  type: 'WS_DISCONNECT_CHAT';
}

interface WebSocketSendMessageAction {
  type: 'WS_SEND_MESSAGE';
  payload: {
    query: string;
    options?: {
      thinking?: boolean;
      system_message?: string;
      temperature?: number;
      extract_knowledge?: boolean;
    };
  };
}

interface WebSocketConnectNotificationsAction {
  type: 'WS_CONNECT_NOTIFICATIONS';
  payload: {
    userId: string;
  };
}

interface WebSocketDisconnectNotificationsAction {
  type: 'WS_DISCONNECT_NOTIFICATIONS';
}

type WebSocketAction = 
  | WebSocketConnectChatAction
  | WebSocketDisconnectChatAction
  | WebSocketSendMessageAction
  | WebSocketConnectNotificationsAction
  | WebSocketDisconnectNotificationsAction;

export const websocketMiddleware: Middleware = store => {
  // 設置聊天 WebSocket 事件處理
  chatWebSocketClient.setCallbacks({
    onMessage: (message: Message) => {
      store.dispatch(addMessage(message));
    },
    onThinking: (message: Message) => {
      if (message.thinking_content) {
        store.dispatch(updateThinkingContent({
          messageId: message.id,
          thinkingContent: message.thinking_content
        }));
      }
      store.dispatch(addMessage(message));
    },
    onError: (error: any) => {
      console.error('Chat WebSocket error:', error);
      store.dispatch(addNotification({
        type: 'error',
        message: typeof error === 'string' ? error : 'Chat connection error occurred',
      }));
    },
    onConnected: () => {
      store.dispatch(addNotification({
        type: 'info',
        message: 'Connected to chat server',
        autoClose: true,
        duration: 3000,
      }));
    },
    onDisconnected: () => {
      // 可能要嘗試重新連接或通知用戶
      store.dispatch(addNotification({
        type: 'warning',
        message: 'Disconnected from chat server. Attempting to reconnect...',
        autoClose: true,
      }));
      
      // 嘗試重新連接
      chatWebSocketClient.reconnect();
    }
  });
  
  // 設置通知 WebSocket 事件處理
  notificationWebSocketClient.setCallbacks({
    onKnowledgeExtractionComplete: (data) => {
      store.dispatch(addNotification({
        type: 'success',
        message: 'Knowledge extraction completed',
        autoClose: true,
      }));
      
      // 添加新節點和邊緣到知識圖譜
      if (data.nodes) {
        data.nodes.forEach((node: KnowledgeNode) => {
          store.dispatch(addNode(node));
        });
      }
      
      if (data.edges) {
        data.edges.forEach((edge: KnowledgeEdge) => {
          store.dispatch(addEdge(edge));
        });
      }
    },
    onReflectionCycleUpdate: (data) => {
      store.dispatch(updateCycleStatus(data as ReflectionCycleStatus));
      
      // 如果反思循環完成，通知用戶
      if (data.status === 'completed') {
        store.dispatch(addNotification({
          type: 'success',
          message: 'Reflection cycle completed',
          autoClose: true,
        }));
      } else if (data.status === 'failed') {
        store.dispatch(addNotification({
          type: 'error',
          message: `Reflection cycle failed: ${data.message}`,
          autoClose: true,
        }));
      }
    },
    onCrossLinkDetected: (data) => {
      store.dispatch(addNotification({
        type: 'info',
        message: 'New cross-topic connection discovered',
        autoClose: true,
      }));
      
      // 添加新邊緣到知識圖譜
      if (data.edge) {
        store.dispatch(addEdge(data.edge));
      }
    },
    onSystemAlert: (data) => {
      store.dispatch(addNotification({
        type: data.level || 'info',
        message: data.message,
        autoClose: data.autoClose !== false,
      }));
      
      // 更新系統狀態（如果包含在通知中）
      if (data.health) {
        store.dispatch(updateSystemHealth(data.health));
      }
      
      if (data.energy) {
        store.dispatch(updateEnergyStatus(data.energy));
      }
    },
    onConnected: () => {
      store.dispatch(addNotification({
        type: 'info',
        message: 'Connected to notification server',
        autoClose: true,
        duration: 3000,
      }));
    },
    onDisconnected: () => {
      // 嘗試重新連接
      store.dispatch(addNotification({
        type: 'warning',
        message: 'Disconnected from notification server. Attempting to reconnect...',
        autoClose: true,
      }));
      
      notificationWebSocketClient.reconnect();
    },
    onError: (error) => {
      console.error('Notification WebSocket error:', error);
      store.dispatch(addNotification({
        type: 'error',
        message: typeof error === 'string' ? error : 'Notification connection error occurred',
      }));
    }
  });
  
  return next => (action: any) => {
    // 處理 WebSocket 相關的 actions
    switch (action.type) {
      case 'WS_CONNECT_CHAT': {
        const { userId, conversationId } = action.payload;
        chatWebSocketClient.connect(userId, conversationId);
        break;
      }
      
      case 'WS_DISCONNECT_CHAT': {
        chatWebSocketClient.disconnect();
        break;
      }
      
      case 'WS_SEND_MESSAGE': {
        const { query, options } = action.payload;
        try {
          chatWebSocketClient.sendMessage(query, options);
        } catch (error) {
          console.error('Failed to send message:', error);
          store.dispatch(addNotification({
            type: 'error',
            message: 'Failed to send message. Please try again.',
          }));
        }
        break;
      }
      
      case 'WS_CONNECT_NOTIFICATIONS': {
        const { userId } = action.payload;
        notificationWebSocketClient.connect(userId);
        break;
      }
      
      case 'WS_DISCONNECT_NOTIFICATIONS': {
        notificationWebSocketClient.disconnect();
        break;
      }
    }
    
    return next(action);
  };
};
