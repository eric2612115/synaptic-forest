import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { KnowledgeGraph, NodeDetails, SearchResults, KnowledgeNode, KnowledgeEdge } from '@/types';
import * as api from '@/lib/api/api-client';

interface KnowledgeGraphState {
  graph: KnowledgeGraph;
  selectedNode: NodeDetails | null;
  searchResults: SearchResults | null;
  historicalData: {
    timestamp: string;
    snapshot: KnowledgeGraph;
  }[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'network' | '3d' | 'cluster' | 'timeline';
  includesDormant: boolean;
  detailLevel: 'low' | 'medium' | 'high';
  currentTopicCluster: string | null;
}

const initialState: KnowledgeGraphState = {
  graph: { nodes: [], edges: [] },
  selectedNode: null,
  searchResults: null,
  historicalData: [],
  isLoading: false,
  error: null,
  viewMode: 'network',
  includesDormant: false,
  detailLevel: 'medium',
  currentTopicCluster: null,
};

export const fetchKnowledgeGraph = createAsyncThunk(
  'knowledgeGraph/fetchKnowledgeGraph',
  async (
    { userId, topicClusterId, includeDormant = false }: 
    { userId: string; topicClusterId?: string; includeDormant?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.getKnowledgeGraph(userId, topicClusterId, includeDormant);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch knowledge graph');
    }
  }
);

export const fetchNodeDetails = createAsyncThunk(
  'knowledgeGraph/fetchNodeDetails',
  async (
    { nodeId, userId, includeNeighbors = true }: 
    { nodeId: string; userId: string; includeNeighbors?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.getNodeDetails(nodeId, userId, includeNeighbors);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch node details');
    }
  }
);

export const searchKnowledgeNodes = createAsyncThunk(
  'knowledgeGraph/searchKnowledgeNodes',
  async (
    { userId, query, limit = 10, minSimilarity = 0.6 }: 
    { userId: string; query: string; limit?: number; minSimilarity?: number },
    { rejectWithValue }
  ) => {
    try {
      const data = await api.searchKnowledge(userId, query, limit, minSimilarity);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search knowledge');
    }
  }
);

const knowledgeGraphSlice = createSlice({
  name: 'knowledgeGraph',
  initialState,
  reducers: {
    clearSelectedNode: (state) => {
      state.selectedNode = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
    changeViewMode: (state, action: PayloadAction<'network' | '3d' | 'cluster' | 'timeline'>) => {
      state.viewMode = action.payload;
    },
    setDetailLevel: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.detailLevel = action.payload;
    },
    toggleDormantNodes: (state) => {
      state.includesDormant = !state.includesDormant;
    },
    setCurrentTopicCluster: (state, action: PayloadAction<string | null>) => {
      state.currentTopicCluster = action.payload;
    },
    // 用於 WebSocket 通知時添加新節點
    addNode: (state, action: PayloadAction<KnowledgeNode>) => {
      // 檢查是否已存在該節點
      const existingIndex = state.graph.nodes.findIndex(n => n.id === action.payload.id);
      if (existingIndex >= 0) {
        state.graph.nodes[existingIndex] = action.payload;
      } else {
        state.graph.nodes.push(action.payload);
      }
      
      // 保存歷史快照
      if (state.graph.nodes.length > 0 && state.graph.edges.length > 0) {
        state.historicalData.push({
          timestamp: new Date().toISOString(),
          snapshot: JSON.parse(JSON.stringify(state.graph))
        });
        
        // 限制歷史記錄數量
        if (state.historicalData.length > 10) {
          state.historicalData.shift();
        }
      }
    },
    // 用於 WebSocket 通知時添加新邊
    addEdge: (state, action: PayloadAction<KnowledgeEdge>) => {
      const existingIndex = state.graph.edges.findIndex(e => e.id === action.payload.id);
      if (existingIndex >= 0) {
        state.graph.edges[existingIndex] = action.payload;
      } else {
        state.graph.edges.push(action.payload);
      }
      
      // 保存歷史快照
      if (state.graph.nodes.length > 0 && state.graph.edges.length > 0) {
        state.historicalData.push({
          timestamp: new Date().toISOString(),
          snapshot: JSON.parse(JSON.stringify(state.graph))
        });
        
        // 限制歷史記錄數量
        if (state.historicalData.length > 10) {
          state.historicalData.shift();
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKnowledgeGraph.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchKnowledgeGraph.fulfilled, (state, action: PayloadAction<KnowledgeGraph>) => {
        state.isLoading = false;
        state.graph = action.payload;
        
        // 保存歷史快照
        if (action.payload.nodes.length > 0 && action.payload.edges.length > 0) {
          state.historicalData.push({
            timestamp: new Date().toISOString(),
            snapshot: JSON.parse(JSON.stringify(action.payload))
          });
          
          // 限制歷史記錄數量
          if (state.historicalData.length > 10) {
            state.historicalData.shift();
          }
        }
      })
      .addCase(fetchKnowledgeGraph.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchNodeDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNodeDetails.fulfilled, (state, action: PayloadAction<NodeDetails>) => {
        state.isLoading = false;
        state.selectedNode = action.payload;
      })
      .addCase(fetchNodeDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(searchKnowledgeNodes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchKnowledgeNodes.fulfilled, (state, action: PayloadAction<SearchResults>) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchKnowledgeNodes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearSelectedNode, 
  clearSearchResults, 
  changeViewMode, 
  setDetailLevel,
  toggleDormantNodes,
  setCurrentTopicCluster,
  addNode,
  addEdge,
  clearError 
} = knowledgeGraphSlice.actions;

export default knowledgeGraphSlice.reducer;
