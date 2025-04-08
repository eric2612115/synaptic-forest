# 可視化實現指南

本文檔提供 Synaptic Forest 視覺化組件的詳細實現指南，特別關注知識圖譜和系統狀態的可視化。

## 視覺化原則

- **漸進式複雜度**: 從簡單視圖開始，逐步增加細節
- **有意義的視覺語言**: 確保每種視覺元素都有明確含義
- **性能優先**: 優化大型知識圖譜的渲染性能
- **視覺一致性**: 維持整個應用的視覺語言一致性

## 知識圖譜視覺化

### 1. 基本網絡視圖

使用 react-force-graph 實現 2D 網絡視圖:

```tsx
import { ForceGraph2D } from 'react-force-graph';

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    importance_score: number;
    // 其他節點屬性...
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    relationship_type: string;
    strength: number;
    // 其他邊屬性...
  }>;
}

function BasicKnowledgeGraph({ graphData }: { graphData: GraphData }) {
  // 轉換數據格式以適配 react-force-graph
  const data = {
    nodes: graphData.nodes.map(node => ({
      id: node.id,
      name: node.label,
      val: node.importance_score * 10, // 控制節點大小
      nodeType: node.type,
      // ...其他屬性
    })),
    links: graphData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.relationship_type,
      strength: edge.strength,
      // ...其他屬性
    }))
  };

  return (
    <ForceGraph2D
      graphData={data}
      nodeRelSize={6}
      nodeAutoColorBy="nodeType"
      linkWidth={link => (link.strength || 0.5) * 3}
      nodeLabel={node => node.name}
      onNodeClick={node => {
        // 處理節點點擊，顯示詳情等
      }}
      // 其他配置...
    />
  );
}
```

### 2. 3D 知識生態系統

使用 React Three Fiber 和 drei 實現更豐富的 3D 視覺效果:

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import { useState, useRef, useMemo } from 'react';
import * as THREE from 'three';

function Knowledge3DNode({ node, position, onSelect }) {
  const size = useMemo(() => node.importance_score * 1.5 || 1, [node]);
  const color = useMemo(() => {
    // 根據節點類型返回不同顏色
    switch (node.type) {
      case 'concept': return new THREE.Color(0x4285F4);
      case 'entity': return new THREE.Color(0x34A853);
      case 'relationship': return new THREE.Color(0xFBBC05);
      default: return new THREE.Color(0xEA4335);
    }
  }, [node]);
  
  const opacity = useMemo(() => 
    node.status === 'active' ? 1 : 0.3, [node]);
  
  const meshRef = useRef();
  
  // 添加一些動畫效果
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });
  
  return (
    <group position={position} onClick={() => onSelect(node)}>
      <Sphere ref={meshRef} args={[size, 32, 32]}>
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={opacity}
          roughness={0.3}
          metalness={0.2}
        />
      </Sphere>
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  );
}

function Knowledge3DEdge({ edge, sourcePos, targetPos }) {
  const points = useMemo(() => [
    new THREE.Vector3(...sourcePos),
    new THREE.Vector3(...targetPos)
  ], [sourcePos, targetPos]);
  
  const lineWidth = useMemo(() => edge.strength * 3 || 0.5, [edge]);
  
  return (
    <Line
      points={points}
      color={edge.relationship_type === 'causal' ? '#ff6000' : '#ffffff'}
      lineWidth={lineWidth}
      opacity={0.6}
      transparent
    />
  );
}

function KnowledgeEcosystem3D({ graphData }) {
  // 使用力導向算法計算節點位置
  const [nodePositions, setNodePositions] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  
  // 初始化力導向佈局...
  // 實際項目中使用 d3-force 或類似庫進行位置計算
  
  return (
    <Canvas camera={{ position: [0, 0, 40], fov: 75 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <fog attach="fog" args={['#171717', 30, 100]} />
      
      {/* 渲染所有節點 */}
      {graphData.nodes.map(node => (
        <Knowledge3DNode
          key={node.id}
          node={node}
          position={nodePositions[node.id] || [0, 0, 0]}
          onSelect={setSelectedNode}
        />
      ))}
      
      {/* 渲染所有連接 */}
      {graphData.edges.map(edge => (
        <Knowledge3DEdge
          key={edge.id}
          edge={edge}
          sourcePos={nodePositions[edge.source] || [0, 0, 0]}
          targetPos={nodePositions[edge.target] || [0, 0, 0]}
        />
      ))}
      
      <OrbitControls />
    </Canvas>
  );
}
```

### 3. 時間演化視圖

使用時間軸控制顯示圖譜演化:

```tsx
import { ForceGraph2D } from 'react-force-graph';
import { useState, useEffect, useMemo } from 'react';
import { Slider, PlayButton } from '../ui/controls';

function KnowledgeEvolutionViewer({ historyData, startTime, endTime }) {
  const [currentTime, setCurrentTime] = useState(endTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // 基於當前時間過濾數據
  const currentData = useMemo(() => {
    return {
      nodes: historyData.nodes.filter(n => 
        new Date(n.created_at) <= new Date(currentTime)),
      links: historyData.edges.filter(e => 
        new Date(e.created_at) <= new Date(currentTime))
    };
  }, [historyData, currentTime]);
  
  // 處理播放邏輯
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const nextTime = new Date(prev.getTime() + 86400000 * playbackSpeed); // 每次前進一天*速度
        if (nextTime > new Date(endTime)) {
          setIsPlaying(false);
          return new Date(endTime);
        }
        return nextTime;
      });
    }, 1000); // 每秒更新
    
    return () => clearInterval(interval);
  }, [isPlaying, endTime, playbackSpeed]);
  
  return (
    <div className="evolution-viewer">
      <div className="graph-container">
        <ForceGraph2D 
          graphData={currentData}
          // 配置參數...
        />
      </div>
      
      <div className="timeline-controls">
        <PlayButton
          isPlaying={isPlaying}
          onToggle={() => setIsPlaying(!isPlaying)}
        />
        
        <Slider
          min={new Date(startTime).getTime()}
          max={new Date(endTime).getTime()}
          value={new Date(currentTime).getTime()}
          onChange={value => {
            setCurrentTime(new Date(value));
            if (isPlaying) setIsPlaying(false);
          }}
          formatLabel={value => new Date(value).toLocaleDateString()}
        />
        
        <select
          value={playbackSpeed}
          onChange={e => setPlaybackSpeed(Number(e.target.value))}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
        </select>
      </div>
      
      <div className="current-time-info">
        {new Date(currentTime).toLocaleString()}
      </div>
    </div>
  );
}
```

## 反思系統可視化

### 1. 反思過程視覺化

使用狀態機圖顯示反思流程:

```tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 反思階段定義
const REFLECTION_STAGES = [
  { id: 'OBSERVE', label: '觀察', color: '#4285F4' },
  { id: 'EVALUATE', label: '評估', color: '#34A853' },
  { id: 'DECIDE', label: '決策', color: '#FBBC05' },
  { id: 'EXECUTE', label: '執行', color: '#EA4335' }
];

function ReflectionProcessViz({ cycleId, status }) {
  const [currentStage, setCurrentStage] = useState(null);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (status && status.stage) {
      setCurrentStage(status.stage);
      setProgress(status.progress || 0);
    }
  }, [status]);
  
  const currentStageIndex = REFLECTION_STAGES.findIndex(s => s.id === currentStage);
  
  return (
    <div className="reflection-process">
      <div className="stage-flow">
        {REFLECTION_STAGES.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isCompleted = idx < currentStageIndex;
          const isPending = idx > currentStageIndex;
          
          return (
            <div key={stage.id} className="stage-item">
              <motion.div
                className={`stage-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                style={{ backgroundColor: stage.color }}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  opacity: isPending ? 0.4 : 1
                }}
              >
                {isCompleted && <CheckIcon />}
                {isActive && (
                  <motion.div 
                    className="progress-indicator"
                    style={{ width: `${progress * 100}%` }}
                  />
                )}
              </motion.div>
              <div className="stage-label">{stage.label}</div>
              
              {idx < REFLECTION_STAGES.length - 1 && (
                <div className={`connector ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="current-activity">
        {status && status.message && (
          <div className="activity-message">{status.message}</div>
        )}
      </div>
    </div>
  );
}
```

### 2. 能量流動可視化

使用流動粒子系統顯示能量分配:

```tsx
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function EnergyFlowViz({ energyData }) {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!svgRef.current || !energyData) return;
    
    const svg = d3.select(svgRef.current);
    const width = +svg.attr('width');
    const height = +svg.attr('height');
    
    // 清空SVG
    svg.selectAll('*').remove();
    
    // 設置力導向圖
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // 處理數據...
    const nodes = energyData.nodes.map(d => Object.assign({}, d));
    const links = energyData.links.map(d => Object.assign({}, d));
    
    // 創建箭頭標記
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 23)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');
    
    // 添加連接線
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');
    
    // 添加節點
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => 5 + d.energy * 15)
      .attr('fill', d => d.type === 'source' ? '#34A853' : '#4285F4')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // 添加粒子效果 - 沿著路徑移動的點
    const particleGroup = svg.append('g');
    
    // 模擬能量流動的粒子
    function renderParticles() {
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source.id || n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target.id || n.id === link.target);
        
        if (!sourceNode || !targetNode) return;
        
        // 每個連接線上創建多個粒子
        const particleCount = Math.floor(link.value * 5);
        
        for (let i = 0; i < particleCount; i++) {
          const particle = particleGroup.append('circle')
            .attr('r', 2)
            .attr('fill', '#fff')
            .attr('opacity', 0.7);
          
          // 粒子動畫
          (function animateParticle() {
            const duration = 1000 + Math.random() * 1000;
            const pathProgress = Math.random();
            
            particle
              .attr('cx', sourceNode.x + (targetNode.x - sourceNode.x) * pathProgress)
              .attr('cy', sourceNode.y + (targetNode.y - sourceNode.y) * pathProgress)
              .transition()
              .duration(duration)
              .ease(d3.easeLinear)
              .attr('cx', targetNode.x)
              .attr('cy', targetNode.y)
              .on('end', () => {
                particle.remove();
                // 50%的機率創建新粒子
                if (Math.random() > 0.5) {
                  setTimeout(() => {
                    animateParticle();
                  }, Math.random() * 500);
                }
              });
          })();
        }
      });
    }
    
    // 設置模擬的tick函數
    simulation
      .nodes(nodes)
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        
        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);
      });
    
    simulation.force('link').links(links);
    
    // 在模擬穩定後創建粒子
    setTimeout(renderParticles, 1000);
    
    // 拖動函數
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // 清理
    return () => {
      simulation.stop();
    };
  }, [energyData]);
  
  return (
    <svg ref={svgRef} width="800" height="600" className="energy-flow-viz" />
  );
}
```

## 系統健康指標可視化

### 1. 儀表板設計

使用儀表盤和環形圖顯示系統健康指標:

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

function MetricGauge({ value, label, min = 0, max = 1, color = '#4285F4' }) {
  const percentage = Math.max(min, Math.min(max, value)) * 100;
  const gaugeData = [
    { name: 'value', value: percentage },
    { name: 'remaining', value: 100 - percentage }
  ];
  
  const gradeColor = value >= 0.8 ? '#34A853' : 
                      value >= 0.6 ? '#FBBC05' : 
                      value >= 0.4 ? '#EA4335' : '#DB4437';
  
  return (
    <div className="metric-gauge">
      <div className="gauge-label">{label}</div>
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={50}
            startAngle={180}
            endAngle={0}
            dataKey="value"
          >
            <Cell key="value" fill={gradeColor} />
            <Cell key="remaining" fill="#e0e0e0" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="gauge-value">{percentage.toFixed(0)}%</div>
    </div>
  );
}

function SystemHealthDashboard({ healthData }) {
  if (!healthData) return <div>加載中...</div>;
  
  const { overall_quality, metrics } = healthData;
  
  return (
    <div className="health-dashboard">
      <div className="overall-health">
        <h3>系統健康狀態</h3>
        <div className="overall-gauge">
          <MetricGauge 
            value={overall_quality} 
            label="整體健康" 
            color="#4285F4" 
          />
        </div>
      </div>
      
      <div className="metrics-grid">
        <MetricGauge
          value={metrics.avg_certainty_score}
          label="確定性"
        />
        <MetricGauge
          value={metrics.graph_density}
          label="連接密度"
        />
        <MetricGauge
          value={metrics.topic_entropy / 1.5} // 標準化值
          label="主題多樣性"
        />
        <MetricGauge
          value={1 - metrics.dormant_node_ratio}
          label="活躍度"
        />
      </div>
      
      <div className="health-rules">
        <h4>規則檢查</h4>
        <div className="rules-summary">
          <div className="rule-group passed">
            <div className="rule-count">{healthData.rules.passed}</div>
            <div className="rule-label">通過</div>
          </div>
          <div className="rule-group warnings">
            <div className="rule-count">{healthData.rules.warnings}</div>
            <div className="rule-label">警告</div>
          </div>
          <div className="rule-group failed">
            <div className="rule-count">{healthData.rules.failed}</div>
            <div className="rule-label">失敗</div>
          </div>
        </div>
      </div>
      
      {healthData.improvements && healthData.improvements.length > 0 && (
        <div className="improvement-suggestions">
          <h4>改進建議</h4>
          <ul className="suggestions-list">
            {healthData.improvements.map((suggestion, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {suggestion}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## 圖譜分層和細節級別

實現不同層次的細節顯示:

```tsx
function KnowledgeGraphWithLOD({ graphData, detailLevel = 'medium' }) {
  // 基於詳細級別過濾和轉換數據
  const processedData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };
    
    let filteredNodes = [...graphData.nodes];
    let filteredEdges = [...graphData.edges];
    
    // 根據詳細級別過濾
    switch (detailLevel) {
      case 'low':
        // 只顯示重要節點和強關係
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.7);
        filteredEdges = filteredEdges.filter(e => 
          e.strength >= 0.6 && 
          filteredNodes.some(n => n.id === e.source) && 
          filteredNodes.some(n => n.id === e.target)
        );
        break;
      
      case 'medium':
        // 顯示中等重要性節點和關係
        filteredNodes = filteredNodes.filter(n => n.importance_score >= 0.4);
        filteredEdges = filteredEdges.filter(e => 
          e.strength >= 0.3 && 
          filteredNodes.some(n => n.id === e.source) && 
          filteredNodes.some(n => n.id === e.target)
        );
        break;
      
      case 'high':
        // 顯示所有節點和關係
        // 不過濾
        break;
    }
    
    return {
      nodes: filteredNodes,
      links: filteredEdges
    };
  }, [graphData, detailLevel]);
  
  return (
    <div className="knowledge-graph-container">
      <div className="detail-controls">
        <label>詳細級別:</label>
        <select
          value={detailLevel}
          onChange={e => setDetailLevel(e.target.value)}
        >
          <option value="low">低 (只顯示重要節點)</option>
          <option value="medium">中 (平衡視圖)</option>
          <option value="high">高 (顯示所有節點)</option>
        </select>
      </div>
      
      <ForceGraph2D 
        graphData={processedData}
        nodeRelSize={6}
        nodeAutoColorBy="type"
        linkWidth={link => (link.strength || 0.5) * 3}
        nodeLabel={node => node.name}
        // 其他配置...
      />
    </div>
  );
}
```

## 性能優化建議

為了確保大型知識圖譜的良好性能:

1. **使用WebGL渲染**:
   - 對於大型圖譜，優先使用WebGL渲染
   - react-force-graph支持WebGL模式(ForceGraphWebGL)

2. **實現節點聚類**:
   - 當節點數量大於特定閾值(如500)時，自動應用聚類
   - 使用社區檢測算法如Louvain方法

3. **分層載入**:
   - 初始只載入和渲染高層次視圖
   - 當用戶放大或選擇特定區域時，再載入詳細數據

4. **優化更新**:
   - 使用差異比較，只更新變化的部分
   - 使用requestAnimationFrame限制更新頻率

5. **視圖端節點過濾**:
   - 實現在前端篩選節點和關係的功能
   - 允許用戶設置可視化閾值

## 視覺語言指南

確保整個應用的視覺表達一致:

### 節點類型視覺編碼

| 節點類型 | 形狀 | 顏色 | 大小基準 |
|---------|------|-----|---------|
| 概念 | 圓形 | #4285F4 (藍色) | 基於重要性 |
| 實體 | 正方形 | #34A853 (綠色) | 基於連接數 |
| 關係 | 菱形 | #FBBC05 (黃色) | 基於強度 |
| 抽象 | 六邊形 | #EA4335 (紅色) | 基於抽象層級 |

### 邊緣類型視覺編碼

| 關係類型 | 線條樣式 | 顏色 | 寬度 |
|---------|---------|------|------|
| 包含 | 實線 | #4285F4 (藍色) | 基於關係強度 |
| 因果 | 虛線 | #EA4335 (紅色) | 基於關係確定性 |
| 關聯 | 點線 | #34A853 (綠色) | 固定 |
| 交叉 | 雙線 | #FBBC05 (黃色) | 基於跨主題強度 |

### 狀態視覺編碼

| 節點狀態 | 視覺效果 |
|---------|---------|
| 活躍 | 完全不透明，明亮 |
| 休眠 | 半透明 (0.3-0.5) |
| 已驗證 | 外環光暈 |
| 待驗證 | 虛線外環 |

保持這些視覺編碼一致將幫助用戶直觀理解系統狀態和知識結構。