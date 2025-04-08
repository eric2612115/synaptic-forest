'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { LightNeuralBackground } from '@/components/visualization/light-neural-background';
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  CallToActionSection,
  Footer,
  ThoughtParticles,
  ScrollToTopButton
} from '@/components/home';

export default function HomePage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Scroll-based animation references
  const { scrollYProgress } = useScroll();
  const opacitySection1 = useTransform(scrollYProgress, [0, 0.15, 0.3], [1, 1, 0]);
  const opacitySection2 = useTransform(scrollYProgress, [0.1, 0.3, 0.5, 0.7], [0, 1, 1, 0]);
  const opacitySection3 = useTransform(scrollYProgress, [0.5, 0.7, 0.9], [0, 1, 1]);
  
  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('synaptic_forest_token');
      if (token) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const scrollToContent = () => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      {/* Neural network background */}
      <LightNeuralBackground />
      
      {/* Container for thought particles */}
      <ThoughtParticles />
      
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-transparent to-background/30 -z-5"></div>

      {/* Hero Section */}
      <motion.div style={{ opacity: opacitySection1 }}>
        <HeroSection onScrollToContent={scrollToContent} />
      </motion.div>

      {/* Key Features Section */}
      <motion.div 
        ref={contentRef} 
        className="relative z-10 min-h-screen backdrop-blur-sm bg-background/20"
        style={{ opacity: opacitySection2 }}
      >
        <div className="container mx-auto px-4 py-24">
          <FeaturesSection />
          <HowItWorksSection />
        </div>
      </motion.div>
      
      {/* Call to Action Section */}
      <motion.div 
        className="relative z-10 py-24 bg-gradient-to-b from-background/0 to-background/50 backdrop-blur-sm"
        style={{ opacity: opacitySection3 }}
      >
        <div className="container mx-auto px-4">
          <CallToActionSection />
          <Footer />
        </div>
      </motion.div>
      
      {/* Scroll to top button */}
      <ScrollToTopButton />
    </div>
  );
}
