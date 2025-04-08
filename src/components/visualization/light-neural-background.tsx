'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export const LightNeuralBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [documentHeight, setDocumentHeight] = useState(0);
  
  // 使用 ResizeObserver 监听文档高度变化
  useEffect(() => {
    const updateDocumentHeight = () => {
      // 获取文档实际高度，包括可滚动内容
      const height = Math.max(
        document.body.scrollHeight, 
        document.documentElement.scrollHeight,
        document.body.offsetHeight, 
        document.documentElement.offsetHeight,
        document.body.clientHeight, 
        document.documentElement.clientHeight,
        window.innerHeight * 1.5  // 确保至少比视窗高度高 50%
      );
      
      setDocumentHeight(height);
    };
    
    // 初始化高度
    updateDocumentHeight();
    
    // 使用 ResizeObserver 监听文档尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      updateDocumentHeight();
    });
    
    // 监听 body 和 document 元素
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);
    
    // 额外监听窗口大小和滚动事件，以确保捕获所有变化
    window.addEventListener('resize', updateDocumentHeight);
    window.addEventListener('scroll', updateDocumentHeight);
    window.addEventListener('DOMContentLoaded', updateDocumentHeight);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDocumentHeight);
      window.removeEventListener('scroll', updateDocumentHeight);
      window.removeEventListener('DOMContentLoaded', updateDocumentHeight);
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置 canvas 尺寸，确保覆盖整个文档
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = documentHeight;
      
      // 必须重设样式以确保覆盖整个页面
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '-10';
      canvas.style.pointerEvents = 'none';
    };
    
    // 初始化 canvas 尺寸
    setCanvasSize();
    
    // 创建粒子 - 增加密度以获得更好的视觉效果
    const particleCount = Math.min(window.innerWidth * window.innerHeight / 6000, 250);
    const particles: {
      x: number;
      y: number;
      radius: number;
      color: string;
      speed: number;
      opacity: number;
      pulse: boolean;
      pulseSpeed: number;
    }[] = [];
    
    // 创建神经连接
    const connections: {
      from: number;
      to: number;
      width: number;
      opacity: number;
      color: string;
      active: boolean;
      interval: number;
      lastActive: number;
    }[] = [];
    
    // 根据主题生成颜色
    const generateColors = () => {
      const isDark = theme === 'dark';
      
      const colors = [
        isDark ? 'rgba(66, 133, 244, 0.8)' : 'rgba(25, 103, 210, 0.8)',  // Blue
        isDark ? 'rgba(52, 168, 83, 0.8)' : 'rgba(15, 157, 88, 0.8)',     // Green
        isDark ? 'rgba(251, 188, 5, 0.8)' : 'rgba(244, 160, 0, 0.8)',     // Yellow
        isDark ? 'rgba(234, 67, 53, 0.8)' : 'rgba(219, 68, 55, 0.8)'      // Red
      ];
      
      return colors;
    };
    
    // 初始化粒子
    const initParticles = () => {
      const colors = generateColors();
      // 确保粒子分布在整个文档高度上
      const scrollHeight = documentHeight;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * scrollHeight, // 使用文档的实际高度
          radius: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 0.2 + 0.05,
          opacity: Math.random() * 0.5 + 0.2,
          pulse: Math.random() > 0.7,
          pulseSpeed: Math.random() * 0.02 + 0.01
        });
      }
    };
    
    // 创建连接，确保覆盖整个高度
    const initConnections = () => {
      const colors = generateColors();
      const connectionCount = Math.min(particleCount, 150);
      
      for (let i = 0; i < connectionCount; i++) {
        const from = Math.floor(Math.random() * particleCount);
        let to = Math.floor(Math.random() * particleCount);
        
        // 确保不自连接
        while (to === from) {
          to = Math.floor(Math.random() * particleCount);
        }
        
        connections.push({
          from,
          to,
          width: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.2 + 0.05,
          color: colors[Math.floor(Math.random() * colors.length)],
          active: false,
          interval: Math.random() * 5000 + 3000,
          lastActive: 0
        });
      }
    };
    
    // 动画循环
    const animate = () => {
      // 清除 canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 获取当前滚动位置，用于计算可见区域
      const scrollY = window.scrollY;
      const visibleTop = scrollY;
      const visibleBottom = scrollY + window.innerHeight;
      
      // 更新粒子
      particles.forEach((particle, index) => {
        // 只渲染接近可见区域的粒子以提高性能
        if (particle.y < visibleBottom + 500 && particle.y > visibleTop - 500) {
          // 随机移动带有轻微y漂移
          particle.x += Math.sin(Date.now() * 0.001 + index) * particle.speed;
          particle.y += Math.cos(Date.now() * 0.001 + index) * particle.speed * 0.5;
          
          // 环绕边缘
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = documentHeight;
          if (particle.y > documentHeight) particle.y = 0;
          
          // 脉冲效果
          if (particle.pulse) {
            const pulse = Math.sin(Date.now() * particle.pulseSpeed) * 0.5 + 0.5;
            ctx.globalAlpha = particle.opacity * pulse;
          } else {
            ctx.globalAlpha = particle.opacity;
          }
          
          // 绘制粒子
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
        }
      });
      
      // 绘制连接
      const now = Date.now();
      connections.forEach(conn => {
        const fromParticle = particles[conn.from];
        const toParticle = particles[conn.to];
        
        // 只绘制接近可见区域的连接以提高性能
        if (
          fromParticle &&
          toParticle &&
          ((fromParticle.y > visibleTop - 500 && fromParticle.y < visibleBottom + 500) ||
           (toParticle.y > visibleTop - 500 && toParticle.y < visibleBottom + 500))
        ) {
          // 计算距离
          const dx = toParticle.x - fromParticle.x;
          const dy = toParticle.y - fromParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 增加可见距离以获得更好的页面覆盖
          if (distance < canvas.width / 2) {
            // 检查是否是激活此连接的时间
            if (now - conn.lastActive > conn.interval) {
              conn.active = Math.random() > 0.5;
              conn.lastActive = now;
            }
            
            // 绘制连接
            ctx.beginPath();
            ctx.moveTo(fromParticle.x, fromParticle.y);
            ctx.lineTo(toParticle.x, toParticle.y);
            
            // 激活的连接有脉冲效果
            if (conn.active) {
              const pulse = Math.sin(now * 0.005) * 0.5 + 0.5;
              ctx.strokeStyle = conn.color;
              ctx.globalAlpha = conn.opacity * (1.5 + pulse);
              ctx.lineWidth = conn.width * 2;
            } else {
              ctx.strokeStyle = conn.color;
              ctx.globalAlpha = conn.opacity;
              ctx.lineWidth = conn.width;
            }
            
            ctx.stroke();
          }
        }
      });
      
      // 继续动画循环
      requestAnimationFrame(animate);
    };
    
    // 初始化
    initParticles();
    initConnections();
    animate();
    
  }, [theme, documentHeight]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`} 
      style={{ 
        background: 'transparent', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
