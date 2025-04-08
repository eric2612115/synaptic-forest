'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ForceGraph2D } from 'react-force-graph';
import * as d3 from 'd3';
import { KnowledgeNode, KnowledgeEdge } from '@/types';

interface TimelineViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

export default function TimelineView({ nodes, edges, onNodeClick, detailLevel }: TimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([new Date(), new Date()]);
  
  // 根據日期過濾節點
  const filteredData = useCallback((date: Date | null) => {
    if (!date) {
      return { nodes: [], edges: [] };
    }
    
    // 根據詳細級別和日期過濾節點
    let filteredNodes = nodes.filter(node => new Date(node.created_at) <= date);
    let filteredEdges: KnowledgeEdge[] = [];
    
    switch (detailLevel) {
      case 'low':
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.7);
        break;
      case 'medium':
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.4);
        break;
      case 'high':
        // 不過濾
        break;
    }
    
    // 過濾邊，確保只包含仍然存在的節點之間的邊
    filteredEdges = edges.filter(edge => 
      new Date(edge.created_at) <= date &&
      filteredNodes.some(n => n.id === edge.source) && 
      filteredNodes.some(n => n.id === edge.target)
    );
    
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

  // 初始化時間範圍和當前日期
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // 獲取最早和最新的節點創建日期
    const dates = nodes.map(node => new Date(node.created_at));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // 設置時間範圍
    setTimeRange([minDate, maxDate]);
    
    // 設置當前日期為最新日期
    setCurrentDate(maxDate);
  }, [nodes]);
  
  // 播放控制
  useEffect(() => {
    if (!isPlaying || !currentDate || !timeRange[1]) return;
    
    const interval = setInterval(() => {
      setCurrentDate(prev => {
        if (!prev) return timeRange[1];
        
        // 每次前進一天乘以速度
        const nextTime = new Date(prev.getTime() + 86400000 * playbackSpeed);
        
        // 如果超過最大日期，停止播放
        if (nextTime > timeRange[1]) {
          setIsPlaying(false);
          return timeRange[1];
        }
        
        return nextTime;
      });
    }, 1000); // 每秒更新
    
    return () => clearInterval(interval);
  }, [isPlaying, currentDate, timeRange, playbackSpeed]);
  
  // 節點顏色映射
  const getNodeColor = useCallback((node: any) => {
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

  // 邊線顏色映射
  const getLinkColor = useCallback((link: any) => {
    if (!link) return '#ccc';
    
    const opacity = 0.6;
    
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

  // 自适应大小
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && graphRef.current) {
        // ForceGraph2D组件可能没有width/height方法
        // 使用DOM设置size代替
        const width = containerRef.current.clientWidth || window.innerWidth;
        const height = (containerRef.current.clientHeight || window.innerHeight) - 80; // 减去控制区域高度
        
        // 直接更新图表容器尺寸
        const graphContainer = containerRef.current.querySelector('div');
        if (graphContainer) {
          graphContainer.style.width = `${width}px`;
          graphContainer.style.height = `${height}px`;
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

  // 格式化日期顯示
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPlaying) setIsPlaying(false);
    
    const timestamp = parseInt(e.target.value);
    setCurrentDate(new Date(timestamp));
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* 主視圖區域 */}
      <div className="flex-1">
        {currentDate && (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData(currentDate)}
            nodeId="id"
            nodeLabel="label"
            nodeAutoColorBy="type"
            nodeRelSize={6}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.label || '';
              const fontSize = 12/globalScale;
              const nodeSize = 5 + (node.importance_score || 0) * 10;
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x || 0, node.y || 0, nodeSize, 0, 2 * Math.PI);
              ctx.fillStyle = getNodeColor(node);
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
            linkColor={(link) => getLinkColor(link)}
            linkWidth={(link) => 1 + (link.strength || 0) * 3}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.25}
            onNodeClick={(node) => onNodeClick(node as KnowledgeNode)}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current?.zoomToFit(400)}
          />
        )}
      </div>
      
      {/* 時間控制區域 */}
      <div className="py-4 px-6 bg-card border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-primary text-primary-foreground rounded-full"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect width="4" height="16" x="6" y="4"></rect>
                <rect width="4" height="16" x="14" y="4"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>
          
          <div className="text-sm whitespace-nowrap">
            {formatDate(currentDate)}
          </div>
          
          <div className="flex-1">
            {timeRange[0] && timeRange[1] && currentDate && (
              <input
                type="range"
                min={timeRange[0].getTime()}
                max={timeRange[1].getTime()}
                value={currentDate.getTime()}
                onChange={handleSliderChange}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            )}
          </div>
          
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-secondary text-sm px-2 py-1 rounded-md"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
