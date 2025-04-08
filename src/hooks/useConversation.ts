import { useEffect, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { 
  fetchConversations, 
  fetchConversationById, 
  createNewConversation, 
  deleteConversationById, 
  clearCurrentConversation 
} from '@/store/slices/conversationSlice';

export function useConversation(conversationId?: string, userId?: string) {
  const dispatch = useAppDispatch();
  const { 
    conversations, 
    currentConversation, 
    isLoading, 
    total, 
    error,
    currentThinkingMessage 
  } = useAppSelector(state => state.conversation);
  
  // 使用useRef代替useState來追蹤請求狀態，避免觸發不必要的重渲染
  const isThrottledRef = useRef(false);
  const lastAttemptTimeRef = useRef(0);
  const conversationsRequestedRef = useRef(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false); // 跟蹤初始載入
  
  // 嘗試次數和無限請求保護
  const attemptCountRef = useRef(0);
  const maxAttempts = 3; // 最多自動重試次數
  
  useEffect(() => {
    // 如果提供了會話ID和用戶ID，則獲取特定會話
    if (conversationId && userId && !isThrottledRef.current) {
      dispatch(fetchConversationById(conversationId));
    }
  }, [conversationId, userId, dispatch]);

  const loadConversations = (userId: string, limit = 10, skip = 0) => {
    // 如果已經加載了對話或者正在節流中，則拒絕請求
    if (isThrottledRef.current || conversationsRequestedRef.current) {
      console.log('Conversations request throttled or in progress');
      // 返回标准的 Error 对象而不是纯对象
      return Promise.reject(new Error('Request throttled or in progress'));
    }
    
    // 如果我們已經有會話數據並經初始加載完成，除非強制重載，否則使用現有數據
    if (conversations && conversations.length > 0 && initialLoadDone) {
      console.log('Using existing conversations data');
      return Promise.resolve({ payload: { conversations, total } });
    }
    
    // 檢查是否超過最大嘗試次數
    if (attemptCountRef.current >= maxAttempts) {
      console.log(`Maximum attempts (${maxAttempts}) reached, stopping automatic retries`);
      return Promise.reject(new Error('Maximum retry attempts reached'));
    }
    
    const now = Date.now();
    // 如果距離上次嘗試時間小於10秒，則使用指數避退策略
    if (now - lastAttemptTimeRef.current < 10000) {
      const backoff = Math.min(30000, 1000 * Math.pow(2, attemptCountRef.current)); // 指數避退，最多30秒
      console.log(`Too many attempts in short period, throttling for ${backoff}ms...`);
      isThrottledRef.current = true;
      
      // 設置適當的延遲後重試
      setTimeout(() => {
        isThrottledRef.current = false;
      }, backoff);
      
      return Promise.reject(new Error(`Too many requests, please wait ${Math.ceil(backoff/1000)} seconds`));
    }
    
    // 更新跟蹤狀態
    lastAttemptTimeRef.current = now;
    conversationsRequestedRef.current = true;
    attemptCountRef.current++;
    
    // 若成功加載，結束初始加載
    setInitialLoadDone(true);
    
    // 設置一個合理的請求冷卻期，避免重複請求
    setTimeout(() => {
      conversationsRequestedRef.current = false;
    }, 15000); // 15秒後才能再次請求
    
    return dispatch(fetchConversations({ userId, limit, skip }));
  };

  const loadConversation = (id: string) => {
    if (isThrottledRef.current) {
      return Promise.reject(new Error('Request throttled'));
    }
    return dispatch(fetchConversationById(id));
  };

  const createConversation = (userId: string, title?: string) => {
    if (isThrottledRef.current) {
      return Promise.reject(new Error('Request throttled'));
    }
    return dispatch(createNewConversation({ userId, title }));
  };

  const deleteConversation = (id: string) => {
    if (isThrottledRef.current) {
      return Promise.reject(new Error('Request throttled'));
    }
    return dispatch(deleteConversationById(id));
  };

  const clearConversation = () => {
    dispatch(clearCurrentConversation());
  };
  
  // 手動重試功能
  const retryLoadConversations = (userId: string, limit = 10, skip = 0) => {
    isThrottledRef.current = false;
    conversationsRequestedRef.current = false;
    attemptCountRef.current = 0; // 重置嘗試次數
    setInitialLoadDone(false); // 允許再次加載
    return loadConversations(userId, limit, skip);
  };
  
  // 可以貴如果要更新UI狀態
  const isThrottled = isThrottledRef.current;

  return {
    conversations,
    currentConversation,
    isLoading,
    total,
    error,
    currentThinkingMessage,
    isThrottled,
    loadConversations,
    loadConversation,
    createConversation,
    deleteConversation,
    clearConversation,
    retryLoadConversations,
    initialLoadDone
  };
}
