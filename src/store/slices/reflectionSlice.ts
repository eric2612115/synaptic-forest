import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReflectionCycleStatus } from '@/types';
import * as api from '@/lib/api/api-client';

interface ReflectionState {
  currentCycle: ReflectionCycleStatus | null;
  cycles: ReflectionCycleStatus[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ReflectionState = {
  currentCycle: null,
  cycles: [],
  isLoading: false,
  error: null,
};

export const triggerReflectionCycle = createAsyncThunk(
  'reflection/triggerReflectionCycle',
  async (
    { userId, energyBudget = 100, priorities = ['connectivity', 'depth', 'verification'] }: 
    { userId: string; energyBudget?: number; priorities?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.triggerReflection(userId, energyBudget, priorities);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to trigger reflection cycle');
    }
  }
);

export const fetchReflectionStatus = createAsyncThunk(
  'reflection/fetchReflectionStatus',
  async (
    { cycleId, userId }: { cycleId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.getReflectionStatus(cycleId, userId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reflection status');
    }
  }
);

const reflectionSlice = createSlice({
  name: 'reflection',
  initialState,
  reducers: {
    updateCycleStatus: (state, action: PayloadAction<ReflectionCycleStatus>) => {
      if (state.currentCycle?.cycle_id === action.payload.cycle_id) {
        state.currentCycle = action.payload;
      }
      
      // 同時更新 cycles 列表
      const cycleIndex = state.cycles.findIndex(c => c.cycle_id === action.payload.cycle_id);
      if (cycleIndex >= 0) {
        state.cycles[cycleIndex] = action.payload;
      } else {
        state.cycles.push(action.payload);
      }
    },
    clearCurrentCycle: (state) => {
      state.currentCycle = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerReflectionCycle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(triggerReflectionCycle.fulfilled, (state, action: PayloadAction<{ cycle_id: string; status: string; message: string }>) => {
        state.isLoading = false;
        // 設置初始狀態，稍後會通過 WebSocket 更新
        const initialStatus: ReflectionCycleStatus = {
          cycle_id: action.payload.cycle_id,
          user_id: '', // 將在後續更新中填充
          stage: 'OBSERVE',
          status: 'in_progress',
          progress: 0,
          message: action.payload.message,
          started_at: new Date().toISOString(),
        };
        state.currentCycle = initialStatus;
        state.cycles.push(initialStatus);
      })
      .addCase(triggerReflectionCycle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchReflectionStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReflectionStatus.fulfilled, (state, action: PayloadAction<ReflectionCycleStatus>) => {
        state.isLoading = false;
        state.currentCycle = action.payload;
        
        // 同時更新 cycles 列表
        const cycleIndex = state.cycles.findIndex(c => c.cycle_id === action.payload.cycle_id);
        if (cycleIndex >= 0) {
          state.cycles[cycleIndex] = action.payload;
        } else {
          state.cycles.push(action.payload);
        }
      })
      .addCase(fetchReflectionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateCycleStatus, clearCurrentCycle, clearError } = reflectionSlice.actions;

export default reflectionSlice.reducer;
