'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { KnowledgeNode, KnowledgeEdge } from '@/types';
import { useKnowledgeGraph } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import NodeDetailsPanel from './NodeDetailsPanel';
import ClientNetworkView from './views/ClientNetworkView';
import ClientThreeDView from './views/ClientThreeDView';
import ClientClusterView from './views/ClientClusterView';
import ClientTimelineView from './views/ClientTimelineView';

export default function ForestVisualization() {
  const dispatch = useAppDispatch();
  const { graph, viewMode, selectedNode, detailLevel } = useAppSelector(state => state.knowledgeGraph);
  const { getNodeDetails, clearNode } = useKnowledgeGraph();
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 處理節點點擊
  const handleNodeClick = useCallback((node: KnowledgeNode) => {
    if (!node || !node.id) return;
    
    getNodeDetails({
      nodeId: node.id,
      userId: 'current-user-id', // 這應該從用戶狀態或上下文中獲取
      includeNeighbors: true
    });
    
    setShowDetails(true);
  }, [getNodeDetails]);
  
  // 關閉詳情面板
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
    clearNode();
  }, [clearNode]);
  
  // 當視圖模式變更時，重設詳情面板
  useEffect(() => {
    setShowDetails(false);
    clearNode();
  }, [viewMode, clearNode]);

  // 根據視圖模式渲染不同的視覺化
  const renderVisualization = () => {
    const commonProps = {
      onNodeClick: handleNodeClick,
      nodes: graph.nodes,
      edges: graph.edges,
      detailLevel,
    };
    
    switch (viewMode) {
      case '3d':
        return <ClientThreeDView {...commonProps} />;
      case 'cluster':
        return <ClientClusterView {...commonProps} />;
      case 'timeline':
        return <ClientTimelineView {...commonProps} />;
      case 'network':
      default:
        return <ClientNetworkView {...commonProps} />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {renderVisualization()}
      
      {/* 節點詳情側邊欄 */}
      <AnimatePresence>
        {showDetails && selectedNode && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 w-96 h-full bg-card border-l shadow-lg overflow-y-auto z-10"
          >
            <NodeDetailsPanel node={selectedNode} onClose={handleCloseDetails} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
