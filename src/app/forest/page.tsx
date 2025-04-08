'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useAuth } from '@/hooks';
import { useKnowledgeGraph } from '@/hooks';
import { setDetailLevel, changeViewMode } from '@/store/slices/knowledgeGraphSlice';
import { addNotification } from '@/store/slices/uiSlice';
import dynamic from 'next/dynamic';

// 使用dynamic导入禁用SSR
const ForestVisualization = dynamic(
  () => import('@/components/forest/ForestVisualization'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-xl font-medium animate-pulse">Loading visualization components...</div>
    </div>
  )}
);

export default function ForestPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    graph, 
    isLoading, 
    viewMode, 
    detailLevel, 
    includesDormant 
  } = useAppSelector(state => state.knowledgeGraph);
  // 不開啟自動加載，我們將手動加載
  const { loadKnowledgeGraph, toggleDormant } = useKnowledgeGraph(undefined, undefined, false);
  
  // 使用堆疊狀態避免重複請求
  const hasInitialLoadRef = useRef(false);
  
  useEffect(() => {
    if (user?.id && !hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      
      loadKnowledgeGraph({ 
        userId: user.id,
        includeDormant: includesDormant
      }).catch(error => {
        // 已在 loadKnowledgeGraph 函數中處理錯誤
        console.log('Knowledge graph load failed:', error);
      });
    }
  }, [user?.id, includesDormant, loadKnowledgeGraph]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    // 實際搜索邏輯將在完整實現中添加
    console.log('Searching for:', searchTerm);
    dispatch(addNotification({
      type: 'info',
      message: `Searching for "${searchTerm}"`,
      autoClose: true,
    }));
  };

  const handleViewModeChange = (mode: 'network' | '3d' | 'cluster' | 'timeline') => {
    dispatch(changeViewMode(mode));
  };

  const handleDetailLevelChange = (level: 'low' | 'medium' | 'high') => {
    dispatch(setDetailLevel(level));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 控制面板 */}
      <div className="bg-card p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="view-mode" className="block text-sm font-medium mb-1">View Mode</label>
            <select
              id="view-mode"
              value={viewMode}
              onChange={(e) => handleViewModeChange(e.target.value as any)}
              className="px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="network">Network</option>
              <option value="3d">3D Forest</option>
              <option value="cluster">Topic Clusters</option>
              <option value="timeline">Timeline</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="detail-level" className="block text-sm font-medium mb-1">Detail Level</label>
            <select
              id="detail-level"
              value={detailLevel}
              onChange={(e) => handleDetailLevelChange(e.target.value as any)}
              className="px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="flex items-center mt-5">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={includesDormant} 
                onChange={toggleDormant}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[hsl(var(--concept))]"></div>
              <span className="ms-3 text-sm font-medium">Show Dormant Nodes</span>
            </label>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </div>
            <input
              type="search"
              className="px-3 py-2 pl-10 pr-4 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-input w-64"
              placeholder="Search knowledge nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* 主視覺化區域 */}
      <div className="flex-1 bg-background overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xl font-medium animate-pulse-slow">Loading knowledge forest...</div>
          </div>
        ) : graph.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-muted-foreground mb-4">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M16.2 7.8C12.4 4 5.5 9.5 8.2 15.5c2.2 4.9 8.1 6.3 11.7 2.7"></path>
              <path d="M8.2 7.8c3.8-3.8 10.7 1.7 8 7.7-2.2 4.9-8.1 6.3-11.7 2.7"></path>
            </svg>
            <h2 className="text-2xl font-bold mb-2">Your forest is empty</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start conversations to grow your knowledge forest. The AI will automatically extract concepts and build connections.
            </p>
            <a 
              href="/conversation" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Start a Conversation
            </a>
          </div>
        ) : (
          <ForestVisualization />
        )}
      </div>
    </div>
  );
}
