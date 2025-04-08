import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { 
  fetchKnowledgeGraph, 
  fetchNodeDetails, 
  searchKnowledgeNodes,
  clearSelectedNode,
  clearSearchResults,
  changeViewMode,
  setDetailLevel,
  toggleDormantNodes,
  setCurrentTopicCluster
} from '@/store/slices/knowledgeGraphSlice';

export function useKnowledgeGraph(userId?: string, topicClusterId?: string, autoLoad = false) {
  const dispatch = useAppDispatch();
  const { 
    graph, 
    selectedNode, 
    searchResults, 
    historicalData,
    isLoading, 
    error, 
    viewMode,
    includesDormant,
    detailLevel,
    currentTopicCluster
  } = useAppSelector(state => state.knowledgeGraph);

  // 只有當 autoLoad 參數為 true 時才自動加載
  useEffect(() => {
    // 如果提供了用戶ID且設置為自動加載，則獲取知識圖譜
    if (autoLoad && userId) {
      dispatch(fetchKnowledgeGraph({ 
        userId, 
        topicClusterId: topicClusterId || currentTopicCluster || undefined, 
        includeDormant: includesDormant 
      }));
    }
  }, [autoLoad, userId, topicClusterId, currentTopicCluster, includesDormant, dispatch]);

  // 隱藏失敗狀態
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const loadingRef = useRef(false);

  // 質量更好的載入函數，避免重複請求
  const loadKnowledgeGraph = useCallback((params: { 
    userId: string; 
    topicClusterId?: string; 
    includeDormant?: boolean 
  }) => {
    // 如果正在加載中，則不重複請求
    if (loadingRef.current || isLoading) {
      console.log('Knowledge graph loading already in progress');
      return Promise.reject({ code: 'LOADING_IN_PROGRESS' });
    }

    // 如果最近加載失敗，則等待一段時間再嘗試
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTime;
    if (loadingFailed && timeSinceLastLoad < 30000) { // 30秒等待時間
      console.log(`Skipping graph load due to recent failure. Waiting ${Math.ceil((30000 - timeSinceLastLoad) / 1000)}s`);
      return Promise.reject({ code: 'RECENT_FAILURE' });
    }

    // 設置加載狀態
    loadingRef.current = true;
    setLastLoadTime(now);
    
    // 執行請求
    return dispatch(fetchKnowledgeGraph(params))
      .then(result => {
        loadingRef.current = false;
        setLoadingFailed(false);
        return result;
      })
      .catch(error => {
        loadingRef.current = false;
        setLoadingFailed(true);
        throw error;
      });
  }, [dispatch, isLoading, loadingFailed, lastLoadTime]);

  const getNodeDetails = (params: { 
    nodeId: string; 
    userId: string; 
    includeNeighbors?: boolean 
  }) => {
    return dispatch(fetchNodeDetails(params));
  };

  const searchNodes = (params: { 
    userId: string; 
    query: string; 
    limit?: number; 
    minSimilarity?: number 
  }) => {
    return dispatch(searchKnowledgeNodes(params));
  };

  const clearNode = () => {
    dispatch(clearSelectedNode());
  };

  const clearSearch = () => {
    dispatch(clearSearchResults());
  };

  const setViewMode = (mode: 'network' | '3d' | 'cluster' | 'timeline') => {
    dispatch(changeViewMode(mode));
  };

  const setNodeDetailLevel = (level: 'low' | 'medium' | 'high') => {
    dispatch(setDetailLevel(level));
  };

  const toggleDormant = () => {
    dispatch(toggleDormantNodes());
  };

  const selectTopicCluster = (clusterId: string | null) => {
    dispatch(setCurrentTopicCluster(clusterId));
  };

  return {
    graph,
    selectedNode,
    searchResults,
    historicalData,
    isLoading,
    error,
    viewMode,
    includesDormant,
    detailLevel,
    currentTopicCluster,
    loadKnowledgeGraph,
    getNodeDetails,
    searchNodes,
    clearNode,
    clearSearch,
    setViewMode,
    setNodeDetailLevel,
    toggleDormant,
    selectTopicCluster
  };
}
