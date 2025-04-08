'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { KnowledgeNode, KnowledgeEdge } from '@/types';

interface ThreeDViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

interface GraphNode extends KnowledgeNode {
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

interface GraphLink extends KnowledgeEdge {
  source: string | GraphNode;
  target: string | GraphNode;
}

// 一個簡單的力導向布局
const useForceLayout = (nodes: GraphNode[], edges: GraphLink[]) => {
  const [positions, setPositions] = useState<{ [key: string]: [number, number, number] }>({});
  
  useEffect(() => {
    // 初始化隨機位置
    const initialPositions: { [key: string]: [number, number, number] } = {};
    nodes.forEach(node => {
      initialPositions[node.id] = [
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      ];
    });
    
    setPositions(initialPositions);
    
    // 在真實應用中，這裡會實現一個三維的力導向算法
    // 這超出了此示例的範圍，但可以使用 d3-force-3d 或類似庫
  }, [nodes, edges]);
  
  return positions;
};

// 節點組件
function KnowledgeNode3D({ node, position, onClick }: { 
  node: GraphNode; 
  position: [number, number, number]; 
  onClick: (node: KnowledgeNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 添加一些動畫效果
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });
  
  // 根據節點類型獲取顏色
  const getNodeColor = () => {
    const opacity = node.status === 'dormant' ? 0.4 : 1;
    
    switch (node.type) {
      case 'concept':
        return new THREE.Color(0x4285F4).multiplyScalar(opacity);
      case 'entity':
        return new THREE.Color(0x34A853).multiplyScalar(opacity);
      case 'relationship':
        return new THREE.Color(0xFBBC05).multiplyScalar(opacity);
      case 'abstract':
        return new THREE.Color(0xEA4335).multiplyScalar(opacity);
      default:
        return new THREE.Color(0xCCCCCC);
    }
  };
  
  // 計算節點大小
  const size = node.importance_score * 1.5 || 1;
  
  return (
    <group position={position} onClick={() => onClick(node)}>
      <Sphere ref={meshRef} args={[size, 32, 32]}>
        <meshStandardMaterial 
          color={getNodeColor()} 
          transparent 
          opacity={node.status === 'active' ? 1 : 0.3}
          roughness={0.3}
          metalness={0.2}
        />
      </Sphere>
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  );
}

// 邊組件
function KnowledgeEdge3D({ edge, sourcePos, targetPos }: {
  edge: GraphLink;
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
}) {
  // 根據關係類型獲取顏色
  const getEdgeColor = () => {
    switch (edge.relationship_type) {
      case 'includes':
        return '#4285F4';
      case 'causes':
        return '#EA4335';
      case 'relates_to':
        return '#34A853';
      case 'cross_references':
        return '#FBBC05';
      default:
        return '#CCCCCC';
    }
  };
  
  const points = [
    new THREE.Vector3(...sourcePos),
    new THREE.Vector3(...targetPos)
  ];
  
  const lineWidth = edge.strength * 3 || 0.5;
  
  return (
    <Line
      points={points}
      color={getEdgeColor()}
      lineWidth={lineWidth}
      opacity={0.6}
      transparent
    />
  );
}

// 主場景組件
function ForestScene({ nodes, edges, onNodeClick, nodePositions }: {
  nodes: GraphNode[];
  edges: GraphLink[];
  onNodeClick: (node: KnowledgeNode) => void;
  nodePositions: { [key: string]: [number, number, number] };
}) {
  // 自動找到合適的相機位置
  const { camera } = useThree();
  
  useEffect(() => {
    // 設置相機初始位置
    camera.position.set(0, 0, 40);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <fog attach="fog" args={['#171717', 30, 100]} />
      
      {/* 渲染所有節點 */}
      {nodes.map(node => {
        const position = nodePositions[node.id] || [0, 0, 0];
        return (
          <KnowledgeNode3D
            key={node.id}
            node={node}
            position={position}
            onClick={onNodeClick}
          />
        );
      })}
      
      {/* 渲染所有邊 */}
      {edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : edge.source.id));
        const targetNode = nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : edge.target.id));
        
        if (!sourceNode || !targetNode) return null;
        
        const sourcePos = nodePositions[sourceNode.id] || [0, 0, 0];
        const targetPos = nodePositions[targetNode.id] || [0, 0, 0];
        
        return (
          <KnowledgeEdge3D
            key={edge.id}
            edge={edge}
            sourcePos={sourcePos}
            targetPos={targetPos}
          />
        );
      })}
    </>
  );
}

export default function ThreeDView({ nodes, edges, onNodeClick, detailLevel }: ThreeDViewProps) {
  // 根據詳細級別過濾節點
  const filteredData = useCallback(() => {
    let filteredNodes = [...nodes] as GraphNode[];
    let filteredEdges = [...edges] as GraphLink[];
    
    switch (detailLevel) {
      case 'low':
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.7);
        filteredEdges = filteredEdges.filter(e => 
          e.strength >= 0.6 && 
          filteredNodes.some(n => n.id === (typeof e.source === 'string' ? e.source : e.source.id)) && 
          filteredNodes.some(n => n.id === (typeof e.target === 'string' ? e.target : e.target.id))
        );
        break;
      
      case 'medium':
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.4);
        filteredEdges = filteredEdges.filter(e => 
          e.strength >= 0.3 && 
          filteredNodes.some(n => n.id === (typeof e.source === 'string' ? e.source : e.source.id)) && 
          filteredNodes.some(n => n.id === (typeof e.target === 'string' ? e.target : e.target.id))
        );
        break;
      
      case 'high':
        // 不過濾，顯示所有節點和邊
        break;
    }
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [nodes, edges, detailLevel]);
  
  const { nodes: filteredNodes, edges: filteredEdges } = filteredData();
  
  // 計算節點位置
  const nodePositions = useForceLayout(filteredNodes, filteredEdges);
  
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 40], fov: 75 }}>
        <ForestScene 
          nodes={filteredNodes} 
          edges={filteredEdges} 
          onNodeClick={onNodeClick} 
          nodePositions={nodePositions}
        />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
