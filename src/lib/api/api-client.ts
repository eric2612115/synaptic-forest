import axios from 'axios';
import { sleep, withRetry, globalRetryState } from '@/lib/utils/functions';
import { shouldThrottleRequest } from '@/lib/utils/request';
import { 
  User, 
  Conversation, 
  ConversationDetails, 
  KnowledgeGraph, 
  NodeDetails, 
  SearchResults,
  ReflectionCycleStatus,
  SystemHealth,
  EnergyStatus
} from '@/types';

// API client configuration
const apiClient = axios.create({
  // Use absolute URL to avoid redirect issues
  baseURL: 'http://127.0.0.1:8001',
  headers: {
    'Content-Type': 'application/json',
  },
  // Do not automatically send cookies/credentials to avoid CORS issues
  withCredentials: false,
  timeout: 20000, // Request timeout set to 20 seconds
});

// Interceptor to set JWT token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Continue request even on error, but don't set token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle exceptions
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle connection failure cases (ECONNREFUSED, ECONNABORTED, ERR_NETWORK)
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.syscall === 'connect') {
      // Silently log errors to avoid flooding the console
      // console.error(`API connection error [${error.code}]: ${error.message || 'Connection failed'}`);
      
      if (globalRetryState) {
        // Update global connection status
        globalRetryState.setConnectionFailed(error, error.config?.url || 'unknown_endpoint');
        
        const now = Date.now();
        const backendDownTime = globalRetryState.backendDownSince ? now - globalRetryState.backendDownSince : 0;
        
        // Control notification frequency
        const notificationThreshold = Math.min(5, 1 + Math.floor(backendDownTime / 300000)); // Increase threshold every 5 minutes, max 5
        
        // Only show notification when conditions are met, to avoid notification spam
        if (!globalRetryState.errorNotified || globalRetryState.consecutiveErrors >= notificationThreshold) {
          if (typeof window !== 'undefined' && (window as any).__store) {
            (window as any).__store.dispatch({
              type: 'ui/addNotification',
              payload: {
                type: 'error',
                message: backendDownTime > 180000 ?
                  `Server has been down for ${Math.floor(backendDownTime/60000)} minutes. Retrying in background.` :
                  'Unable to connect to server. Please check if the server is running.',
                autoClose: true,
                duration: 15000
              }
            });
            globalRetryState.errorNotified = true;
          }
        }
      }
    }
    
    // Handle 401 error (Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized API request - clearing token');
      // Clear invalid token
      try {
        localStorage.removeItem('access_token');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
    
    // Handle 429 error (Rate limit)
    if (error.response && error.response.status === 429) {
      // Get retry delay time if server provided Retry-After header
      const retryAfter = error.response.headers['retry-after'];
      const retryDelay = retryAfter ? (parseInt(retryAfter, 10) * 1000) : 15000; // Default 15 seconds
      
      console.warn(`Rate limit exceeded. Retrying after ${retryDelay/1000} seconds`);
      
      // Show user notification
      try {
        if (typeof window !== 'undefined' && (window as any).__store) {
          (window as any).__store.dispatch({
            type: 'ui/addNotification',
            payload: {
              type: 'warning',
              message: `API request rate too high, please wait ${Math.ceil(retryDelay/1000)} seconds and try again...`,
              autoClose: true,
              duration: Math.min(retryDelay, 5000)
            }
          });
        }
      } catch (e) {
        console.error('Failed to show rate limit notification:', e);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication related APIs
export async function login(username: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
  return withRetry(async () => {
    try {
      console.log('Attempting login with:', { username });
      
      // Use OAuth2 standard form-urlencoded format for login
      const response = await fetch('http://127.0.0.1:8001/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username,
          password
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        // If it's rate limit, throw specific error for withRetry to handle
        if (response.status === 429) {
          const error: any = new Error(`Rate limit exceeded with status: ${response.status}`);
          error.response = { status: 429 };
          throw error;
        }
        throw new Error(`Login failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Login response data:', data);
      
      // Store token in local storage
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      
      return data;
    } catch (error: any) {
      console.error('Login error details:', error);
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }, 3, 5000, 60000);
}

export async function logout(): Promise<void> {
  // Delete token from local storage
  localStorage.removeItem('access_token');
  
  // Request server logout to invalidate cookies
  try {
    await withRetry(async () => {
      await apiClient.post('/logout');
    }, 3, 5000, 30000);
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with local logout even if server logout fails
  }
}

export async function getCurrentUser(): Promise<User> {
  return withRetry(async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  }, 3, 5000, 30000);
}

// Conversation management APIs
export async function createConversation(userId: string, title?: string): Promise<Conversation> {
  return withRetry(async () => {
    // Ensure URL ends with slash to avoid redirects
    const response = await apiClient.post('/api/public/conversations/', {
      user_id: userId,
      title: title || 'New Conversation',
    });
    
    // Handle field name mismatch issue (_id -> id)
    const data = response.data;
    if (data) {
      data.id = data._id || data.id;
    }
    
    return data;
  }, 3, 5000, 30000);
}

export async function getUserConversations(
  userId: string,
  limit = 10,
  skip = 0
): Promise<{ conversations: Conversation[]; total: number }> {
  return withRetry(async () => {
    const response = await apiClient.get(`/api/public/conversations/user/${userId}?limit=${limit}&skip=${skip}`);
    
    // Handle field name mismatch issue (_id -> id)
    const data = response.data;
    if (data.conversations && Array.isArray(data.conversations)) {
      data.conversations = data.conversations.map(conv => ({
        ...conv,
        id: conv._id || conv.id // 确保存在id字段
      }));
    }
    
    return data;
  }, 3, 5000, 30000, `/api/public/conversations/user/${userId}`);
}

export async function getConversation(
  conversationId: string,
  includeMessages = true
): Promise<ConversationDetails> {
  return withRetry(async () => {
    const response = await apiClient.get(`/api/public/conversations/${conversationId}?include_messages=${includeMessages}`);
    
    // 处理字段名称不匹配问题 (_id -> id)
    const data = response.data;
    if (data) {
      // Handle conversation id
      data.id = data._id || data.id;
      
      // If there are messages, handle message ids
      if (data.messages && Array.isArray(data.messages)) {
        data.messages = data.messages.map(msg => ({
          ...msg,
          id: msg._id || msg.id
        }));
      }
    }
    
    return data;
  }, 3, 5000, 30000);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  return withRetry(async () => {
    await apiClient.delete(`/api/public/conversations/${conversationId}`);
  }, 3, 5000, 30000);
}

// Knowledge graph operation APIs
export async function getKnowledgeGraph(
  userId: string,
  topicClusterId?: string,
  includeDormant = false
): Promise<KnowledgeGraph> {
  const params: any = {
    user_id: userId,
    include_dormant: String(includeDormant)
  };

  if (topicClusterId) {
    params.topic_cluster_id = topicClusterId;
  }
  
  // Check if request should be throttled
  if (shouldThrottleRequest('/api/public/knowledge/graph', params)) {
    return Promise.reject({
      message: 'Request throttled to avoid repeated calls',
      code: 'REQUEST_THROTTLED'
    });
  }
  
  // If global connection failed and recently attempted, return error directly
  if (globalRetryState.connectionFailed && 
      globalRetryState.backendDownSince && 
      (Date.now() - globalRetryState.backendDownSince < 30000)) {
    return Promise.reject({
      message: 'Backend service is currently unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
  
  const paramsString = new URLSearchParams(params).toString();
  
  return withRetry(async () => {
    const response = await apiClient.get(`/api/public/knowledge/graph?${paramsString}`);
    return response.data;
  }, 2, 5000, 30000, `/api/public/knowledge/graph`);
}

export async function getNodeDetails(
  nodeId: string,
  userId: string,
  includeNeighbors = false
): Promise<NodeDetails> {
  return withRetry(async () => {
    const params = new URLSearchParams({
      user_id: userId,
      include_neighbors: String(includeNeighbors),
    });

    const response = await apiClient.get(`/api/public/knowledge/node/${nodeId}?${params.toString()}`);
    return response.data;
  }, 3, 5000, 30000);
}

export async function searchKnowledge(
  userId: string,
  query: string,
  limit = 10,
  minSimilarity = 0.6
): Promise<SearchResults> {
  return withRetry(async () => {
    const params = new URLSearchParams({
      user_id: userId,
      query: query,
      limit: String(limit),
      min_similarity: String(minSimilarity),
    });

    const response = await apiClient.get(`/api/public/knowledge/search?${params.toString()}`);
    return response.data;
  }, 3, 5000, 30000);
}

// Reflection system APIs
export async function triggerReflection(
  userId: string,
  energyBudget = 100,
  priorities: string[] = ['connectivity', 'depth', 'verification']
): Promise<{ cycle_id: string; status: string; message: string }> {
  return withRetry(async () => {
    const response = await apiClient.post('/api/reflection/trigger', {
      user_id: userId,
      energy_budget: energyBudget,
      priorities: priorities,
    });
    return response.data;
  }, 3, 5000, 30000);
}

export async function getReflectionStatus(
  cycleId: string,
  userId: string
): Promise<ReflectionCycleStatus> {
  return withRetry(async () => {
    const params = new URLSearchParams({
      user_id: userId,
    });

    const response = await apiClient.get(`/api/reflection/cycle/${cycleId}?${params.toString()}`);
    return response.data;
  }, 3, 5000, 30000);
}

// System health API
export async function getSystemHealth(userId: string): Promise<SystemHealth> {
  // Get API call permission to avoid too frequent calls
  if (globalRetryState.isPolling && globalRetryState.lastPollingTime && 
      (Date.now() - globalRetryState.lastPollingTime < 5000)) {
    return Promise.reject({
      message: 'Too frequent polling, throttled',
      code: 'POLLING_THROTTLED'
    });
  }
  
  return withRetry(async () => {
    globalRetryState.isPolling = true;
    globalRetryState.lastPollingTime = Date.now();
    
    const response = await apiClient.get(`/api/system/health?user_id=${userId}`);
    return response.data;
  }, 2, 15000, 60000, `/api/system/health`);
}

// Energy system API
export async function getEnergyStatus(userId: string): Promise<EnergyStatus> {
  // Get API call permission to avoid too frequent calls
  if (globalRetryState.isPolling && globalRetryState.lastPollingTime && 
      (Date.now() - globalRetryState.lastPollingTime < 5000)) {
    return Promise.reject({
      message: 'Too frequent polling, throttled',
      code: 'POLLING_THROTTLED'
    });
  }
  
  return withRetry(async () => {
    globalRetryState.isPolling = true;
    globalRetryState.lastPollingTime = Date.now();
    
    const response = await apiClient.get(`/api/energy/status?user_id=${userId}`);
    return response.data;
  }, 2, 15000, 60000, `/api/energy/status`);
}

export default apiClient;
