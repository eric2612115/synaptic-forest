'use client';

import React, { useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface Node {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  connected: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number; // 透明度
  color: string;
  speed: number; // 移动速度
  targetX: number; // 目标位置
  targetY: number;
  progress: number; // 移动进度 (0-1)
}

interface NeuralBackgroundProps {
  className?: string;
}

export const NeuralBackground: React.FC<NeuralBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  
  // 使用useRef来存储动画状态，避免重新渲染导致状态丢失
  const nodesRef = useRef<Node[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>();
  const nodeCountRef = useRef<number>(30); // 节点数量
  
  // 生成随机节点
  const generateNodes = (width: number, height: number): Node[] => {
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCountRef.current; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1, // 1-3px
        vx: (Math.random() - 0.5) * 0.2, // 随机速度
        vy: (Math.random() - 0.5) * 0.2,
        connected: false // 是否与其他节点相连
      });
    }
    return nodes;
  };
  
  // 节点之间是否应该连接
  const shouldConnect = (nodeA: Node, nodeB: Node, width: number, height: number): boolean => {
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // 距离小于屏幕对角线的15%才连接
    const diagonalLength = Math.sqrt(width * width + height * height);
    return distance < diagonalLength * 0.15;
  };
  
  // 创建新的脉冲粒子
  const createParticle = (startX: number, startY: number, endX: number, endY: number): Particle => {
    // 计算两点之间的距离
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 确定粒子颜色 (主题相关)
    const isDark = theme === 'dark';
    const colors = [
      isDark ? 'rgba(66, 133, 244, 0.6)' : 'rgba(66, 133, 244, 0.5)', // 蓝色
      isDark ? 'rgba(52, 168, 83, 0.6)' : 'rgba(52, 168, 83, 0.5)',  // 绿色
      isDark ? 'rgba(251, 188, 5, 0.6)' : 'rgba(251, 188, 5, 0.5)',  // 黄色
      isDark ? 'rgba(234, 67, 53, 0.6)' : 'rgba(234, 67, 53, 0.5)'   // 红色
    ];
    
    return {
      x: startX,
      y: startY,
      size: Math.random() * 1.5 + 0.5, // 0.5 - 2 px
      alpha: Math.random() * 0.3 + 0.2, // 0.2 - 0.5
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 1 + 0.5, // 速度
      targetX: endX,
      targetY: endY,
      progress: 0
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置canvas全屏
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // 重新生成节点
      nodesRef.current = generateNodes(canvas.width, canvas.height);
    };

    // 添加调整大小监听器
    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化大小

    // 随机生成粒子的概率 (每帧)
    const particleGenerationProbability = 0.1;

    // 动画函数
    const animate = () => {
      if (!canvas || !ctx) return;

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景色
      const isDark = theme === 'dark';
      ctx.fillStyle = isDark ? 'rgba(10, 12, 20, 0.5)' : 'rgba(245, 247, 250, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制连接线
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
      ctx.lineWidth = 0.3;
      
      // 重置连接状态
      nodesRef.current.forEach(node => {
        node.connected = false;
      });

      // 绘制网络连接
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const nodeA = nodesRef.current[i];
          const nodeB = nodesRef.current[j];
          
          if (shouldConnect(nodeA, nodeB, canvas.width, canvas.height)) {
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
            
            nodeA.connected = true;
            nodeB.connected = true;
            
            // 随机生成粒子
            if (Math.random() < particleGenerationProbability / 50) {
              particlesRef.current.push(
                createParticle(nodeA.x, nodeA.y, nodeB.x, nodeB.y)
              );
            }
          }
        }
      }

      // 更新和绘制节点
      nodesRef.current.forEach(node => {
        // 更新位置
        node.x += node.vx;
        node.y += node.vy;
        
        // 边界检查
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        
        // 绘制节点
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        // 如果节点有连接，则使用更明显的颜色
        if (node.connected) {
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
        } else {
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        }
        
        ctx.fill();
      });

      // 更新和绘制粒子
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        
        // 更新进度
        particle.progress += particle.speed / 100;
        
        if (particle.progress >= 1) {
          // 如果到达目标，移除粒子
          particlesRef.current.splice(i, 1);
          continue;
        }
        
        // 计算当前位置（线性插值）
        particle.x = particle.x + (particle.targetX - particle.x) * particle.speed / 100;
        particle.y = particle.y + (particle.targetY - particle.y) * particle.speed / 100;
        
        // 绘制粒子
        ctx.globalAlpha = particle.alpha * Math.sin(particle.progress * Math.PI); // 淡入淡出效果
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // 恢复默认透明度
      }

      // 随机生成新的粒子
      if (Math.random() < particleGenerationProbability) {
        const connectedNodes = nodesRef.current.filter(node => node.connected);
        if (connectedNodes.length >= 2) {
          const startNodeIndex = Math.floor(Math.random() * connectedNodes.length);
          let endNodeIndex;
          do {
            endNodeIndex = Math.floor(Math.random() * connectedNodes.length);
          } while (endNodeIndex === startNodeIndex);

          const startNode = connectedNodes[startNodeIndex];
          const endNode = connectedNodes[endNodeIndex];

          if (shouldConnect(startNode, endNode, canvas.width, canvas.height)) {
            particlesRef.current.push(
              createParticle(startNode.x, startNode.y, endNode.x, endNode.y)
            );
          }
        }
      }

      // 保持粒子数量在合理范围内
      while (particlesRef.current.length > 100) {
        particlesRef.current.shift();
      }

      // 继续动画循环
      requestRef.current = requestAnimationFrame(animate);
    };

    // 启动动画
    requestRef.current = requestAnimationFrame(animate);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [theme]); // 只在主题变化时重新创建效果

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      style={{ pointerEvents: 'none' }} // 确保不影响点击
    />
  );
};
