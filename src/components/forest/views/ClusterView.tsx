'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { KnowledgeNode, KnowledgeEdge } from '@/types';

interface ClusterViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

interface ClusterNode {
  id: string;
  label: string;
  type: string;
  cluster: string;
  value: number;
  status: string;
}

interface ClusterData {
  name: string;
  children: ClusterNode[];
}

export default function ClusterView({ nodes, edges, onNodeClick, detailLevel }: ClusterViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clusters, setClusters] = useState<{ [key: string]: KnowledgeNode[] }>({});
  
  // 將節點分組到集群中
  useEffect(() => {
    // 在實際應用中，後端可能已經提供了主題集群ID
    // 這裡我們只是分組通過集群ID模擬
    const clusterGroups: { [key: string]: KnowledgeNode[] } = {};
    
    nodes.forEach(node => {
      const clusterId = node.topic_cluster_id || 'uncategorized';
      
      if (!clusterGroups[clusterId]) {
        clusterGroups[clusterId] = [];
      }
      
      clusterGroups[clusterId].push(node);
    });
    
    setClusters(clusterGroups);
  }, [nodes]);

  // 過濾節點基於詳細級別
  const getFilteredClusters = useCallback(() => {
    const filteredClusters: { [key: string]: KnowledgeNode[] } = {};
    
    Object.keys(clusters).forEach(clusterId => {
      let filteredNodes = [...clusters[clusterId]];
      
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
      
      if (filteredNodes.length > 0) {
        filteredClusters[clusterId] = filteredNodes;
      }
    });
    
    return filteredClusters;
  }, [clusters, detailLevel]);

  // 繪製圓形填充視圖
  useEffect(() => {
    if (!containerRef.current) return;
    
    const filteredClusters = getFilteredClusters();
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // 準備數據
    const data: ClusterData = {
      name: "Knowledge Forest",
      children: Object.keys(filteredClusters).flatMap(clusterId => {
        return filteredClusters[clusterId].map(node => ({
          id: node.id,
          label: node.label,
          type: node.type,
          cluster: clusterId,
          value: Math.max(5, node.importance_score * 30), // 節點大小基於重要性
          status: node.status
        }));
      })
    };
    
    // 清除舊的SVG
    d3.select(containerRef.current).select("svg").remove();
    
    // 創建新的SVG
    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .style("font", "10px sans-serif")
      .style("background", "transparent");
    
    // 創建分層布局
    const pack = d3.pack<ClusterData | ClusterNode>()
      .size([width, height])
      .padding(3);
    
    const root = d3.hierarchy<ClusterData | ClusterNode>(data)
      .sum(d => 'value' in d ? d.value : 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    
    const nodes = pack(root).descendants().slice(1); // 跳過根節點
    
    // 創建每個節點的容器
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);
    
    // 添加圓形
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => {
        const nodeData = d.data as ClusterNode;
        const opacity = nodeData.status === 'dormant' ? 0.4 : 1;
        
        // 節點類型顏色
        switch (nodeData.type) {
          case 'concept':
            return `hsl(var(--concept) / ${opacity})`;
          case 'entity':
            return `hsl(var(--entity) / ${opacity})`;
          case 'relationship':
            return `hsl(var(--relationship) / ${opacity})`;
          case 'abstract':
            return `hsl(var(--abstract) / ${opacity})`;
          default:
            return "#ccc";
        }
      })
      .attr("fill-opacity", d => {
        const nodeData = d.data as ClusterNode;
        return nodeData.status === 'dormant' ? 0.4 : 0.8;
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("click", (event, d) => {
        const nodeData = d.data as ClusterNode;
        const originalNode = nodes.find(n => n.id === nodeData.id);
        if (originalNode) {
          onNodeClick(originalNode);
        }
      });
    
    // 添加文本標籤
    node.filter(d => d.r > 20)
      .append("text")
      .attr("dy", ".3em")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .text(d => {
        const nodeData = d.data as ClusterNode;
        return nodeData.label;
      })
      .style("font-size", d => Math.min(d.r / 5, 12) + "px");
    
    // 添加集群標籤
    const clusterGroups: { [key: string]: d3.HierarchyCircularNode<ClusterData | ClusterNode>[] } = {};
    
    nodes.forEach(node => {
      const nodeData = node.data as ClusterNode;
      const clusterId = nodeData.cluster;
      
      if (!clusterGroups[clusterId]) {
        clusterGroups[clusterId] = [];
      }
      
      clusterGroups[clusterId].push(node);
    });
    
    // 對每個集群，計算包圍盒並添加標籤
    Object.keys(clusterGroups).forEach(clusterId => {
      const clusterNodes = clusterGroups[clusterId];
      
      if (clusterNodes.length === 0) return;
      
      // 計算集群的中心點
      const centerX = d3.mean(clusterNodes, d => d.x) || 0;
      const centerY = d3.mean(clusterNodes, d => d.y) || 0;
      
      // 獲取集群中最遠的節點距離，作為集群半徑
      const radius = Math.max(...clusterNodes.map(d => 
        Math.sqrt(Math.pow(d.x - centerX, 2) + Math.pow(d.y - centerY, 2)) + d.r
      ));
      
      // 創建集群背景圓形
      svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius)
        .attr("fill", `hsl(${(parseInt(clusterId, 36) % 360)}, 70%, 60%)`)
        .attr("fill-opacity", 0.1)
        .attr("stroke", `hsl(${(parseInt(clusterId, 36) % 360)}, 70%, 60%)`)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-opacity", 0.8)
        .lower(); // 將圓放到最底層
      
      // 添加集群標籤
      svg.append("text")
        .attr("x", centerX)
        .attr("y", centerY - radius - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "currentColor")
        .text(`Cluster: ${clusterId}`);
    });
    
    // 添加縮放功能
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 8])
        .on("zoom", (event) => {
          node.attr("transform", d => `translate(${d.x * event.transform.k + event.transform.x},${d.y * event.transform.k + event.transform.y}) scale(${event.transform.k})`);
          svg.selectAll("circle:not(g circle)").each(function(d: any) {
            const element = d3.select(this);
            element.attr("cx", (d.cx || d.x || 0) * event.transform.k + event.transform.x);
            element.attr("cy", (d.cy || d.y || 0) * event.transform.k + event.transform.y);
            element.attr("r", (d.r || 0) * event.transform.k);
          });
          svg.selectAll("text:not(g text)").each(function(d: any) {
            const element = d3.select(this);
            element.attr("x", (d.x || 0) * event.transform.k + event.transform.x);
            element.attr("y", ((d.y || 0) - (d.r || 0) - 10) * event.transform.k + event.transform.y);
          });
        }) as any
    );
    
  }, [getFilteredClusters, onNodeClick]);
  
  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
