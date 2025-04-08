import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SystemHealth, EnergyStatus, EnergyFlow } from '@/types';
import * as api from '@/lib/api/api-client';

interface SystemState {
  health: SystemHealth | null;
  energy: EnergyStatus | null;
  energyFlow: EnergyFlow | null;
  isLoading: boolean;
  error: string | null;
  connectionFailed: boolean;
  lastConnectionError: string | null;
}

const initialState: SystemState = {
  health: null,
  energy: null,
  energyFlow: null,
  isLoading: false,
  error: null,
  connectionFailed: false,
  lastConnectionError: null,
};

export const fetchSystemHealth = createAsyncThunk(
  'system/fetchSystemHealth',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await api.getSystemHealth(userId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system health');
    }
  }
);

export const fetchEnergyStatus = createAsyncThunk(
  'system/fetchEnergyStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await api.getEnergyStatus(userId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch energy status');
    }
  }
);

// 假設後端有一個 API 來獲取能量流數據，這里模擬一個
export const fetchEnergyFlow = createAsyncThunk(
  'system/fetchEnergyFlow',
  async (userId: string, { rejectWithValue }) => {
    try {
      // 假設的 API 調用，實際應該換成真實的 API
      // const data = await api.getEnergyFlow(userId);
      
      // 模擬數據，真實情況下應通過 API 獲取
      const data: EnergyFlow = {
        nodes: [
          { id: 'source', type: 'source', energy: 1, label: 'Energy Source' },
          { id: 'conversation', type: 'consumer', energy: 0.3, label: 'Conversation' },
          { id: 'extraction', type: 'consumer', energy: 0.2, label: 'Knowledge Extraction' },
          { id: 'reflection', type: 'consumer', energy: 0.4, label: 'Reflection' },
          { id: 'maintenance', type: 'consumer', energy: 0.1, label: 'Maintenance' },
        ],
        links: [
          { source: 'source', target: 'conversation', value: 0.3 },
          { source: 'source', target: 'extraction', value: 0.2 },
          { source: 'source', target: 'reflection', value: 0.4 },
          { source: 'source', target: 'maintenance', value: 0.1 },
        ]
      };
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch energy flow');
    }
  }
);

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    updateEnergyStatus: (state, action: PayloadAction<EnergyStatus>) => {
      state.energy = action.payload;
    },
    updateSystemHealth: (state, action: PayloadAction<SystemHealth>) => {
      state.health = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setConnectionFailed: (state, action: PayloadAction<{error?: string}>) => {
      state.connectionFailed = true;
      state.lastConnectionError = action.payload.error || "Connection failed";
    },
    resetConnection: (state) => {
      state.connectionFailed = false;
      state.lastConnectionError = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemHealth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action: PayloadAction<SystemHealth>) => {
        state.isLoading = false;
        state.health = action.payload;
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        
        // 檢查是否為連接失敗錯誤
        if (action.error?.message?.includes('ECONNREFUSED') || 
            action.error?.message?.includes('connect failed') ||
            action.error?.code === 'ECONNREFUSED') {
          state.connectionFailed = true;
          state.lastConnectionError = action.error.message || 'Connection failed';
        }
      })
      .addCase(fetchEnergyStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEnergyStatus.fulfilled, (state, action: PayloadAction<EnergyStatus>) => {
        state.isLoading = false;
        state.energy = action.payload;
        state.connectionFailed = false; // 重設連接失敗狀態
      })
      .addCase(fetchEnergyStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        
        // 檢查是否為連接失敗錯誤
        if (action.error?.message?.includes('ECONNREFUSED') || 
            action.error?.message?.includes('connect failed') ||
            action.error?.code === 'ECONNREFUSED') {
          state.connectionFailed = true;
          state.lastConnectionError = action.error.message || 'Connection failed';
        }
      })
      .addCase(fetchEnergyFlow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEnergyFlow.fulfilled, (state, action: PayloadAction<EnergyFlow>) => {
        state.isLoading = false;
        state.energyFlow = action.payload;
      })
      .addCase(fetchEnergyFlow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateEnergyStatus, updateSystemHealth, clearError, setConnectionFailed, resetConnection } = systemSlice.actions;

export default systemSlice.reducer;
