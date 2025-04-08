'use client';

import { useRef, useEffect, useCallback } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { KnowledgeNode, KnowledgeEdge } from '@/types';
import * as d3 from 'd3';

interface NetworkViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

interface GraphNode extends KnowledgeNode {
  x?: number;
  y?: number;
  index?: number;
}

interface GraphLink extends KnowledgeEdge {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function NetworkView({ nodes, edges, onNodeClick, detailLevel }: NetworkViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  
  // 將我們的節點和邊轉換為 ForceGraph2D 需要的格式
  const graphData = useCallback(() => {
    // 根據詳細級別過濾節點
    let filteredNodes = [...nodes];
    let filteredEdges = [...edges];
    
    switch (detailLevel) {
      case 'low':
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.7);
        filteredEdges = filteredEdges.filter(e => 
          e.strength >= 0.6 && 
          filteredNodes.some(n => n.id === e.source) && 
          filteredNodes.some(n => n.id === e.target)
        );
        break;
      
      case 'medium':
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.4);
        filteredEdges = filteredEdges.filter(e => 
          e.strength >= 0.3 && 
          filteredNodes.some(n => n.id === e.source) && 
          filteredNodes.some(n => n.id === e.target)
        );
        break;
      
      case 'high':
        // 不過濾，顯示所有節點和邊
        break;
    }
    
    return {
      nodes: filteredNodes.map(node => ({
        ...node,
        id: node.id,
        name: node.label,
      })),
      links: filteredEdges.map(edge => ({
        ...edge,
        source: edge.source,
        target: edge.target,
      }))
    };
  }, [nodes, edges, detailLevel]);

  // 節點顏色映射
  const getNodeColor = useCallback((node: GraphNode) => {
    if (!node) return '#ccc';
    
    const opacity = node.status === 'dormant' ? '80' : 'ff';
    
    switch (node.type) {
      case 'concept':
        return `hsl(var(--concept) / ${node.status === 'dormant' ? 0.4 : 1})`;
      case 'entity':
        return `hsl(var(--entity) / ${node.status === 'dormant' ? 0.4 : 1})`;
      case 'relationship':
        return `hsl(var(--relationship) / ${node.status === 'dormant' ? 0.4 : 1})`;
      case 'abstract':
        return `hsl(var(--abstract) / ${node.status === 'dormant' ? 0.4 : 1})`;
      default:
        return '#ccc';
    }
  }, []);

  // 節點大小計算
  const getNodeSize = useCallback((node: GraphNode) => {
    if (!node) return 5;
    return 5 + node.importance_score * 10;
  }, []);

  // 邊線顏色映射
  const getLinkColor = useCallback((link: GraphLink) => {
    if (!link) return '#ccc';
    
    const opacity = 0.6; // 可以根據邊的強度來調整
    
    switch (link.relationship_type) {
      case 'includes':
        return `hsl(var(--concept) / ${opacity})`;
      case 'causes':
        return `hsl(var(--abstract) / ${opacity})`;
      case 'relates_to':
        return `hsl(var(--entity) / ${opacity})`;
      case 'cross_references':
        return `hsl(var(--relationship) / ${opacity})`;
      default:
        return '#ccc';
    }
  }, []);

  // 邊線寬度計算
  const getLinkWidth = useCallback((link: GraphLink) => {
    if (!link) return 1;
    return 1 + link.strength * 3;
  }, []);

  // 自适应大小
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && graphRef.current) {
        // ForceGraph2D组件可能没有width/height方法
        // 使用DOM设置size代替
        const width = containerRef.current.clientWidth || window.innerWidth;
        const height = containerRef.current.clientHeight || window.innerHeight;
        
        // 直接更新图表容器尺寸
        if (containerRef.current) {
          containerRef.current.style.width = `${width}px`;
          containerRef.current.style.height = `${height}px`;
        }
        
        // 如果图表实例已创建，尝试清除缓存并重新渲染
        if (typeof graphRef.current.d3Force === 'function') {
          // ForceGraph使用d3 forces，可以重新设置并触发重渲染
          try {
            graphRef.current.d3Force('center', null);
            graphRef.current.d3Force('center', d3.forceCenter(width/2, height/2));
            graphRef.current.d3ReheatSimulation();
          } catch (e) {
            console.warn('Unable to set d3Force:', e);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // 稍后执行，确保组件已完全渲染
    setTimeout(handleResize, 100);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData()}
        nodeId="id"
        nodeLabel="label"
        nodeAutoColorBy="type"
        nodeRelSize={6}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as GraphNode).label;
          const fontSize = 12/globalScale;
          const nodeSize = getNodeSize(node as GraphNode);
          
          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, nodeSize, 0, 2 * Math.PI);
          ctx.fillStyle = getNodeColor(node as GraphNode);
          ctx.fill();
          
          // Draw node label if zoom is enough
          if (globalScale >= 0.8) {
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(label, node.x || 0, node.y || 0);
          }
        }}
        linkColor={(link) => getLinkColor(link as GraphLink)}
        linkWidth={(link) => getLinkWidth(link as GraphLink)}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        onNodeClick={(node) => onNodeClick(node as KnowledgeNode)}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400)}
      />
    </div>
  );
}
