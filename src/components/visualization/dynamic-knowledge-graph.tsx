'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';

// 节点类型
interface Node {
  id: string;
  group: number; // 节点类型/群组
  label: string;
  size: number; // 节点大小
  status: 'growing' | 'stable' | 'shrinking' | 'new'; // 节点状态
  age: number; // 节点年龄
}

// 连接类型
interface Link {
  source: string;
  target: string;
  value: number; // 连接强度
  type: 'direct' | 'abstract' | 'causal'; // 连接类型
}

// 图表数据结构
interface GraphData {
  nodes: Node[];
  links: Link[];
}

// 模拟数据
const generateMockData = (): GraphData => {
  // 主题/概念节点
  const conceptNodes: Node[] = [
    { id: 'ai', group: 1, label: 'Artificial Intelligence', size: 15, status: 'stable', age: 30 },
    { id: 'ml', group: 1, label: 'Machine Learning', size: 12, status: 'growing', age: 25 },
    { id: 'nlp', group: 1, label: 'Natural Language Processing', size: 10, status: 'growing', age: 20 },
    { id: 'cv', group: 1, label: 'Computer Vision', size: 8, status: 'stable', age: 18 },
    { id: 'rl', group: 1, label: 'Reinforcement Learning', size: 7, status: 'growing', age: 15 },
    { id: 'nn', group: 1, label: 'Neural Networks', size: 11, status: 'growing', age: 22 },
  ];

  // 实体节点
  const entityNodes: Node[] = [
    { id: 'llm', group: 2, label: 'Large Language Models', size: 9, status: 'growing', age: 8 },
    { id: 'transformer', group: 2, label: 'Transformer', size: 7, status: 'stable', age: 12 },
    { id: 'cnn', group: 2, label: 'CNN', size: 6, status: 'shrinking', age: 16 },
    { id: 'gan', group: 2, label: 'GAN', size: 5, status: 'shrinking', age: 14 },
    { id: 'bert', group: 2, label: 'BERT', size: 8, status: 'stable', age: 10 },
    { id: 'gpt', group: 2, label: 'GPT', size: 9, status: 'growing', age: 6 },
  ];

  // 抽象/关系节点
  const abstractNodes: Node[] = [
    { id: 'representation', group: 3, label: 'Representation Learning', size: 7, status: 'growing', age: 10 },
    { id: 'generative', group: 3, label: 'Generative Models', size: 8, status: 'growing', age: 9 },
    { id: 'discriminative', group: 3, label: 'Discriminative Models', size: 6, status: 'stable', age: 12 },
    { id: 'attention', group: 3, label: 'Attention Mechanism', size: 7, status: 'growing', age: 8 },
    { id: 'embedding', group: 3, label: 'Embeddings', size: 6, status: 'stable', age: 14 },
  ];

  // 新生成的节点（将以动画形式"生长"）
  const newNodes: Node[] = [
    { id: 'multimodal', group: 4, label: 'Multimodal Learning', size: 3, status: 'new', age: 0 },
    { id: 'reasoning', group: 4, label: 'AI Reasoning', size: 2, status: 'new', age: 0 },
    { id: 'prompt', group: 4, label: 'Prompt Engineering', size: 4, status: 'new', age: 0 },
    { id: 'diffusion', group: 4, label: 'Diffusion Models', size: 3, status: 'new', age: 0 },
  ];

  // 所有节点
  const allNodes = [...conceptNodes, ...entityNodes, ...abstractNodes, ...newNodes];

  // 创建连接
  const links: Link[] = [
    // AI 与其他核心概念的连接
    { source: 'ai', target: 'ml', value: 8, type: 'direct' },
    { source: 'ai', target: 'nlp', value: 7, type: 'direct' },
    { source: 'ai', target: 'cv', value: 7, type: 'direct' },
    { source: 'ai', target: 'rl', value: 6, type: 'direct' },
    
    // ML与其他概念的连接
    { source: 'ml', target: 'nn', value: 7, type: 'direct' },
    { source: 'ml', target: 'rl', value: 5, type: 'direct' },
    
    // NLP与相关技术的连接
    { source: 'nlp', target: 'llm', value: 8, type: 'direct' },
    { source: 'nlp', target: 'transformer', value: 7, type: 'direct' },
    { source: 'nlp', target: 'bert', value: 7, type: 'direct' },
    { source: 'nlp', target: 'gpt', value: 8, type: 'direct' },
    
    // CV与相关技术的连接
    { source: 'cv', target: 'cnn', value: 7, type: 'direct' },
    { source: 'cv', target: 'gan', value: 6, type: 'direct' },
    
    // 具体技术与抽象概念的连接
    { source: 'transformer', target: 'attention', value: 8, type: 'abstract' },
    { source: 'bert', target: 'embedding', value: 7, type: 'abstract' },
    { source: 'llm', target: 'representation', value: 6, type: 'abstract' },
    { source: 'gan', target: 'generative', value: 7, type: 'abstract' },
    { source: 'cnn', target: 'discriminative', value: 6, type: 'abstract' },
    
    // 因果关系连接
    { source: 'nn', target: 'cnn', value: 5, type: 'causal' },
    { source: 'nn', target: 'transformer', value: 6, type: 'causal' },
    { source: 'transformer', target: 'llm', value: 7, type: 'causal' },
    { source: 'llm', target: 'gpt', value: 8, type: 'causal' },
    
    // 新节点的连接
    { source: 'gpt', target: 'multimodal', value: 5, type: 'direct' },
    { source: 'gpt', target: 'reasoning', value: 6, type: 'direct' },
    { source: 'llm', target: 'prompt', value: 7, type: 'direct' },
    { source: 'generative', target: 'diffusion', value: 6, type: 'causal' },
  ];

  return { nodes: allNodes, links };
};

interface DynamicKnowledgeGraphProps {
  width?: number;
  height?: number;
  className?: string;
}

export const DynamicKnowledgeGraph: React.FC<DynamicKnowledgeGraphProps> = ({
  width = 800,
  height = 600,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const [data, setData] = useState<GraphData>(generateMockData());
  const [time, setTime] = useState<number>(0);

  // 定义颜色方案（根据主题和节点组）
  const getNodeColor = (group: number, status: string) => {
    const colors = {
      dark: {
        1: '#4285F4', // 概念 - 蓝色
        2: '#34A853', // 实体 - 绿色
        3: '#FBBC05', // 抽象 - 黄色
        4: '#EA4335', // 新节点 - 红色
      },
      light: {
        1: '#1a73e8', // 概念 - 深蓝色
        2: '#188038', // 实体 - 深绿色
        3: '#f29900', // 抽象 - 深黄色
        4: '#d93025', // 新节点 - 深红色
      }
    };
    
    const colorScheme = theme === 'dark' ? colors.dark : colors.light;
    
    if (status === 'shrinking') {
      // 对于萎缩的节点，减少饱和度
      return d3.color(colorScheme[group as 1 | 2 | 3 | 4])?.darker(0.5).toString() || colorScheme[group as 1 | 2 | 3 | 4];
    } else if (status === 'new') {
      // 对于新节点，增加亮度
      return d3.color(colorScheme[group as 1 | 2 | 3 | 4])?.brighter(0.5).toString() || colorScheme[group as 1 | 2 | 3 | 4];
    }
    
    return colorScheme[group as 1 | 2 | 3 | 4];
  };

  // 定义连接颜色
  const getLinkColor = (type: string) => {
    const colors = {
      dark: {
        direct: 'rgba(255, 255, 255, 0.3)',
        abstract: 'rgba(251, 188, 5, 0.3)',
        causal: 'rgba(234, 67, 53, 0.3)'
      },
      light: {
        direct: 'rgba(0, 0, 0, 0.2)',
        abstract: 'rgba(242, 153, 0, 0.3)', 
        causal: 'rgba(217, 48, 37, 0.3)'
      }
    };
    
    return theme === 'dark' ? colors.dark[type as 'direct' | 'abstract' | 'causal'] : colors.light[type as 'direct' | 'abstract' | 'causal'];
  };

  // 模拟知识图谱的演化
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
      
      // 每10个时间单位更新一次图谱
      if (time % 10 === 0) {
        setData(prevData => {
          // 深拷贝当前数据
          const newData = JSON.parse(JSON.stringify(prevData)) as GraphData;
          
          // 更新节点状态
          newData.nodes = newData.nodes.map(node => {
            // 增加节点年龄
            node.age += 1;
            
            // 根据节点状态更新大小
            if (node.status === 'growing') {
              node.size = Math.min(node.size + 0.2, 15); // 限制最大尺寸
              if (Math.random() < 0.1) node.status = 'stable'; // 10%的几率稳定
            } else if (node.status === 'stable') {
              if (Math.random() < 0.05) node.status = 'shrinking'; // 5%的几率开始萎缩
            } else if (node.status === 'shrinking') {
              node.size = Math.max(node.size - 0.3, 2); // 限制最小尺寸
            } else if (node.status === 'new') {
              node.size += 0.5; // 新节点快速增长
              if (node.size >= 5) node.status = 'growing';
            }
            
            return node;
          });
          
          // 有机率添加新节点和连接
          if (Math.random() < 0.2 && time > 30) { // 20%的概率添加新节点
            const newNodeId = `node_${Date.now()}`;
            
            // 随机选择一个现有节点作为连接对象
            const randomSourceIdx = Math.floor(Math.random() * newData.nodes.length);
            const sourceNode = newData.nodes[randomSourceIdx];
            
            // 添加新节点
            newData.nodes.push({
              id: newNodeId,
              group: Math.floor(Math.random() * 3) + 2, // 随机分配组 (2-4)
              label: `New Concept ${newData.nodes.length + 1}`,
              size: 1,
              status: 'new',
              age: 0
            });
            
            // 添加新连接
            newData.links.push({
              source: sourceNode.id,
              target: newNodeId,
              value: 3 + Math.random() * 3, // 随机强度 (3-6)
              type: ['direct', 'abstract', 'causal'][Math.floor(Math.random() * 3)] as 'direct' | 'abstract' | 'causal'
            });
          }
          
          return newData;
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [time]);

  // 渲染力导向图
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;
    
    // 清空SVG
    d3.select(svgRef.current).selectAll('*').remove();
    
    // 创建SVG元素
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
    
    // Add background gradient for depth
    const defs = svg.append('defs');
    
    // Create radial gradient
    const gradient = defs.append('radialGradient')
      .attr('id', 'bg-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', theme === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.4)');
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', theme === 'dark' ? 'rgba(15, 23, 42, 0.1)' : 'rgba(226, 232, 240, 0.1)');
      
    // Apply gradient
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#bg-gradient)')
      .attr('opacity', 0.4);
      
    // Add glow effect for nodes
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
      
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    // 定义箭头标记（用于因果连接）
    defs.selectAll('marker')
      .data(['causal'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', theme === 'dark' ? 'rgba(234, 67, 53, 0.7)' : 'rgba(217, 48, 37, 0.7)')
      .attr('d', 'M0,-5L10,0L0,5');
    
    // 设置力导向模拟
    const simulation = d3.forceSimulation<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node> & Link>()
      .force('link', d3.forceLink()
        .id(d => (d as Node).id)
        .distance(link => 100 - ((link as Link).value * 5))
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as Node).size * 2));
    
    // 创建连接
    const linkGroup = svg.append('g');
    
    // Add subtle particle effects for links
    const linkParticles = linkGroup.selectAll('.link-particle-group')
      .data(data.links)
      .enter().append('g')
      .attr('class', 'link-particle-group');
      
    // Main links
    const link = linkGroup.selectAll('.link')
      .data(data.links)
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke-width', d => d.value / 2)
      .attr('stroke', d => getLinkColor(d.type))
      .attr('marker-end', d => d.type === 'causal' ? 'url(#arrow-causal)' : '')
      .attr('opacity', 0.6);
      
    // Add particle effects on important links
    data.links.filter(d => d.value > 5).forEach((d, i) => {
      linkParticles.append('circle')
        .filter(() => d.value > 5) // Only add particles to strong links
        .attr('r', 1.5)
        .attr('fill', getLinkColor(d.type))
        .attr('opacity', 0.8)
        .attr('filter', 'url(#glow)')
        .datum({link: d, offset: Math.random()}) // Store link data and random offset
        .attr('class', `particle-${i}`);
    });
    
    // 创建节点组
    const node = svg.append('g')
      .selectAll('.node')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );
    
    // 添加节点圆圈
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => getNodeColor(d.group, d.status))
      .attr('stroke', d => d3.color(getNodeColor(d.group, d.status))?.darker().toString() || '')
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#glow)');
    
    // 添加闪烁效果（新节点）
    node.filter(d => d.status === 'new')
      .append('circle')
      .attr('r', d => d.size * 1.5)
      .attr('fill', 'none')
      .attr('stroke', d => getNodeColor(d.group, d.status))
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.5)
      .attr('class', 'neural-pulse')
      .call(selection => {
        selection.transition()
          .duration(2500)
          .attr('r', d => d.size * 4)
          .attr('opacity', 0)
          .on('end', function() { 
            // Recreate pulse effect for continuous animation
            const parent = d3.select(this.parentNode);
            if (parent.datum().status === 'new') {
              parent.append('circle')
                .attr('r', d => d.size * 1.5)
                .attr('fill', 'none')
                .attr('stroke', d => getNodeColor(d.group, d.status))
                .attr('stroke-width', 0.5)
                .attr('opacity', 0.5)
                .attr('class', 'neural-pulse')
                .transition()
                .duration(2500)
                .attr('r', d => d.size * 4)
                .attr('opacity', 0)
                .on('end', function() { d3.select(this).remove(); });
            }
            d3.select(this).remove(); 
          });
      });
    
    // 添加节点标签，仅对较大节点显示
    node.filter(d => d.size > 6) // Only show labels for larger nodes
      .append('text')
      .attr('dx', d => d.size + 5)
      .attr('dy', '.35em')
      .attr('font-size', d => Math.min(10 + d.size / 3, 14))
      .text(d => d.label)
      .attr('fill', theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')
      .style('pointer-events', 'none')
      .attr('opacity', 0.9);
    
    // Function to animate particles along the links
    const animateParticles = () => {
      linkParticles.selectAll('circle').each(function(d: any) {
        if (!d || !d.link) return;
        
        const sourceNode = d.link.source as Node;
        const targetNode = d.link.target as Node;
        
        if (!sourceNode.x || !targetNode.x) return;
        
        // Calculate position along the path based on time
        d.offset = (d.offset + 0.01) % 1.0;
        
        // Interpolate position
        const x = sourceNode.x + (targetNode.x - sourceNode.x) * d.offset;
        const y = sourceNode.y + (targetNode.y - sourceNode.y) * d.offset;
        
        // Update particle position
        d3.select(this)
          .attr('cx', x)
          .attr('cy', y);
      });
    };

    // Start animation loop for particles
    let animationFrameId: number;
    const animate = () => {
      animateParticles();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    
    // Configure simulation with tick function
    simulation
      .nodes(data.nodes as (d3.SimulationNodeDatum & Node)[])
      .on('tick', () => {
        // Apply bounds to keep nodes within the view
        data.nodes.forEach(d => {
          if (d.x !== undefined && d.y !== undefined) {
            d.x = Math.max(d.size, Math.min(width - d.size, d.x));
            d.y = Math.max(d.size, Math.min(height - d.size, d.y));
          }
        });
        
        // Update links
        link
          .attr('x1', d => (d.source as Node).x || 0)
          .attr('y1', d => (d.source as Node).y || 0)
          .attr('x2', d => (d.target as Node).x || 0)
          .attr('y2', d => (d.target as Node).y || 0);
        
        // Update nodes
        node
          .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
      });
    
    simulation.force<d3.ForceLink<d3.SimulationNodeDatum & Node, d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node> & Link>>('link')
      ?.links(data.links as (d3.SimulationLinkDatum<d3.SimulationNodeDatum & Node> & Link)[]);
    
    // Run simulation with higher alpha for better layout
    simulation.alpha(1).restart();
    
    // When nodes are learning from each other, create temporary connection visuals
    const showLearningEffect = () => {
      // Randomly select nodes that could learn from each other
      if (Math.random() > 0.7 && data.nodes.length > 5) {
        const idx1 = Math.floor(Math.random() * data.nodes.length);
        let idx2 = Math.floor(Math.random() * data.nodes.length);
        // Make sure we select different nodes
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * data.nodes.length);
        }
        
        const sourceNode = data.nodes[idx1];
        const targetNode = data.nodes[idx2];
        
        if (sourceNode.x === undefined || targetNode.x === undefined) return;
        
        // Create a temporary neural connection
        const learningConnection = svg.append('path')
          .attr('d', `M${sourceNode.x},${sourceNode.y} Q${(sourceNode.x + targetNode.x) / 2 + Math.random() * 50 - 25},${(sourceNode.y + targetNode.y) / 2 + Math.random() * 50 - 25} ${targetNode.x},${targetNode.y}`)
          .attr('stroke', d3.color(getNodeColor(sourceNode.group, sourceNode.status))?.brighter().toString())
          .attr('stroke-width', 1)
          .attr('fill', 'none')
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0)
          .attr('filter', 'url(#glow)');
          
        // Animate the connection
        learningConnection
          .transition()
          .duration(1000)
          .attr('opacity', 0.6)
          .transition()
          .duration(1000)
          .attr('opacity', 0)
          .on('end', function() { d3.select(this).remove(); });
      }
    };
    
    // Periodically show learning effects
    const learningInterval = setInterval(showLearningEffect, 3000);
    
    return () => {
      simulation.stop();
      clearInterval(learningInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [data, theme, width, height]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 neural-grid-bg opacity-20"></div>
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Only show legend when not used as background */}
      {className.includes('h-[400px]') && (
        <div className="absolute bottom-4 left-4 p-3 bg-background/80 backdrop-blur-sm border rounded-md shadow-md">
          <p className="text-xs">
            <span className="inline-block w-3 h-3 rounded-full mr-1" style={{backgroundColor: "#4285F4"}}></span> Concepts
            <span className="inline-block w-3 h-3 rounded-full ml-3 mr-1" style={{backgroundColor: "#34A853"}}></span> Entities
            <span className="inline-block w-3 h-3 rounded-full ml-3 mr-1" style={{backgroundColor: "#FBBC05"}}></span> Abstractions
            <span className="inline-block w-3 h-3 rounded-full ml-3 mr-1" style={{backgroundColor: "rgb(255, 80, 63)"}}></span> New Knowledge
          </p>
        </div>
      )}
    </div>
  );
};
