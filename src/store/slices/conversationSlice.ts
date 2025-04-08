import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, ConversationDetails, Message } from '@/types';
import * as api from '@/lib/api/api-client';

interface ConversationState {
  conversations: Conversation[];
  currentConversation: ConversationDetails | null;
  isLoading: boolean;
  total: number;
  error: string | null;
  currentThinkingMessage: Message | null;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  isLoading: false,
  total: 0,
  error: null,
  currentThinkingMessage: null,
};

export const fetchConversations = createAsyncThunk(
  'conversation/fetchConversations',
  async ({ userId, limit = 10, skip = 0 }: { userId: string; limit?: number; skip?: number }, { rejectWithValue }) => {
    try {
      const data = await api.getUserConversations(userId, limit, skip);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchConversationById = createAsyncThunk(
  'conversation/fetchConversationById',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const data = await api.getConversation(conversationId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversation');
    }
  }
);

export const createNewConversation = createAsyncThunk(
  'conversation/createNewConversation',
  async ({ userId, title }: { userId: string; title?: string }, { rejectWithValue }) => {
    try {
      const data = await api.createConversation(userId, title);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const deleteConversationById = createAsyncThunk(
  'conversation/deleteConversationById',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await api.deleteConversation(conversationId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete conversation');
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.currentConversation) {
        // 如果是 thinking 類型訊息，更新現有訊息
        if (action.payload.message_type === 'thinking') {
          state.currentThinkingMessage = action.payload;
        } else {
          // 如果是正常訊息，添加到訊息列表
          if (!state.currentConversation.messages) {
            state.currentConversation.messages = [];
          }
          
          // 檢查是否已存在該訊息
          const existingIndex = state.currentConversation.messages.findIndex(m => m.id === action.payload.id);
          if (existingIndex >= 0) {
            state.currentConversation.messages[existingIndex] = action.payload;
          } else {
            state.currentConversation.messages.push(action.payload);
          }
          
          // 更新conversation預覽
          state.currentConversation.last_message_preview = action.payload.content.substring(0, 100);
          state.currentConversation.updated_at = action.payload.created_at;
          
          // 更新conversations列表中的對應項目
          const conversationIndex = state.conversations.findIndex(c => c.id === state.currentConversation?.id);
          if (conversationIndex >= 0) {
            state.conversations[conversationIndex].last_message_preview = action.payload.content.substring(0, 100);
            state.conversations[conversationIndex].updated_at = action.payload.created_at;
          }
          
          // 清除thinking訊息
          state.currentThinkingMessage = null;
        }
      }
    },
    updateThinkingContent: (state, action: PayloadAction<{ messageId: string; thinkingContent: string }>) => {
      if (state.currentThinkingMessage && state.currentThinkingMessage.id === action.payload.messageId) {
        state.currentThinkingMessage.thinking_content = action.payload.thinkingContent;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<{ conversations: Conversation[]; total: number }>) => {
        state.isLoading = false;
        state.conversations = action.payload.conversations;
        state.total = action.payload.total;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchConversationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversationById.fulfilled, (state, action: PayloadAction<ConversationDetails>) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createNewConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
        state.isLoading = false;
        state.conversations = [action.payload, ...state.conversations];
        state.total += 1;
      })
      .addCase(createNewConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteConversationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteConversationById.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.conversations = state.conversations.filter(c => c.id !== action.payload);
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null;
        }
        state.total -= 1;
      })
      .addCase(deleteConversationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearCurrentConversation, 
  addMessage, 
  updateThinkingContent,
  clearError 
} = conversationSlice.actions;

export default conversationSlice.reducer;
