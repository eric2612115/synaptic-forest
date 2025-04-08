import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import conversationReducer from './slices/conversationSlice';
import knowledgeGraphReducer from './slices/knowledgeGraphSlice';
import reflectionReducer from './slices/reflectionSlice';
import systemReducer from './slices/systemSlice';
import uiReducer from './slices/uiSlice';
import { websocketMiddleware } from './middleware/websocketMiddleware';

export const store = configureStore({
  // 定义 reducer 和其他配置
  reducer: {
    auth: authReducer,
    conversation: conversationReducer,
    knowledgeGraph: knowledgeGraphReducer,
    reflection: reflectionReducer,
    system: systemReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 允許 WebSocket 等非序列化物件
    }).concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 將 store 暴露到全局窗口对象上，方便 API 拦截器使用
if (typeof window !== 'undefined') {
  (window as any).__store = store;
}
