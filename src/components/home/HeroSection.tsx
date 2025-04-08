'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onScrollToContent: () => void;
}

export default function HeroSection({ onScrollToContent }: HeroSectionProps) {
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.section 
      className="relative min-h-screen flex flex-col items-center justify-center px-4 z-10"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      style={{ willChange: 'opacity' }}
    >
      <div className="text-center max-w-4xl animate-fadeIn opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards', animationDuration: '1.5s' }}>
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
          Synaptic Forest
        </h1>
        <p className="text-xl md:text-2xl mb-12 text-foreground/90">
          A self-evolving knowledge ecosystem that grows with your thoughts
        </p>
        
        {showContent && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 animate-fadeIn opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards', animationDuration: '1s' }}>
            <Link href="/register" className="px-8 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Enter the Forest
            </Link>
          </div>
        )}
        
        <div 
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer animate-fadeIn opacity-0"
          style={{ animationDelay: '1.5s', animationFillMode: 'forwards', animationDuration: '1s' }}
          onClick={onScrollToContent}
        >
          <p className="text-sm text-foreground/70">Explore Features</p>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="animate-bounce text-primary"
          >
            <path d="M12 5v14"></path>
            <path d="m19 12-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </motion.section>
  );
}
