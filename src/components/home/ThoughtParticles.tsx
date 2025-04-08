'use client';

import { useRef, useEffect } from 'react';

export default function ThoughtParticles() {
  const thoughtsContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add scroll event listener for thought particles
    window.addEventListener('scroll', generateThoughtParticles);
    
    return () => {
      window.removeEventListener('scroll', generateThoughtParticles);
    };
  }, []);
  
  // Function to create thought particles on scroll
  const generateThoughtParticles = () => {
    if (!thoughtsContainerRef.current) return;
    
    // Create a new thought particle
    const particle = document.createElement('div');
    particle.classList.add('thought-particle');
    
    // Randomize position, size and color
    const size = Math.random() * 20 + 10; // 10-30px
    const left = Math.random() * 100; // 0-100%
    const hue = 200 + Math.random() * 60; // blue-purple range (200-260)
    
    // Apply styles
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.bottom = '0';
    particle.style.position = 'absolute';
    particle.style.borderRadius = '50%';
    particle.style.background = `radial-gradient(circle, hsla(${hue}, 100%, 70%, 0.7) 0%, hsla(${hue}, 100%, 70%, 0) 70%)`;
    
    // Add to container
    thoughtsContainerRef.current.appendChild(particle);
    
    // Remove after animation completes
    setTimeout(() => {
      if (thoughtsContainerRef.current && thoughtsContainerRef.current.contains(particle)) {
        thoughtsContainerRef.current.removeChild(particle);
      }
    }, 3000);
  };

  return (
    <div ref={thoughtsContainerRef} className="fixed inset-0 pointer-events-none z-10 overflow-hidden"></div>
  );
}
