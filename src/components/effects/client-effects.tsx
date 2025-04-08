'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ServiceStatusMonitor } from '@/components/ui/service-status-monitor';

export function ClientEffects() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Only apply special effects on homepage
  const isHomePage = pathname === '/';
  
  useEffect(() => {
    setMounted(true);
    
    if (isHomePage) {
      // Add subtle mouse follower effect on homepage
      const handleMouseMove = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        
        // Create or update follower element
        let follower = document.getElementById('neural-follower');
        if (!follower) {
          follower = document.createElement('div');
          follower.id = 'neural-follower';
          follower.className = 'fixed pointer-events-none w-64 h-64 rounded-full bg-gradient-to-br from-primary/5 to-white/5 blur-3xl -z-10 opacity-0 transition-opacity duration-500';
          document.body.appendChild(follower);
          
          // Make visible after a short delay
          setTimeout(() => {
            if (follower) follower.classList.replace('opacity-0', 'opacity-100');
          }, 200);
        }
        
        // Position the follower with a slight delay for smooth movement
        if (follower) {
          const updatePosition = () => {
            if (follower) {
              follower.style.left = `${x - 128}px`;
              follower.style.top = `${y - 128}px`;
            }
          };
          
          // Use requestAnimationFrame for smoother animation
          requestAnimationFrame(updatePosition);
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        const follower = document.getElementById('neural-follower');
        if (follower) {
          follower.remove();
        }
      };
    }
  }, [isHomePage]);
  
  // Don't render visible DOM content - this component only adds effects and monitors
  return <ServiceStatusMonitor />;
}
