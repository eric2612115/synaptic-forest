'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';

export default function FeaturesSection() {
  const featuresRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-12">
      <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center">Core Features</h2>
      <p className="text-xl text-center mb-16 max-w-3xl mx-auto text-foreground/80">
        Discover how Synaptic Forest creates a living knowledge ecosystem that adapts to your exploration.
      </p>

      <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative overflow-hidden">
        {/* Energy flow animations */}
        <div className="absolute -z-10 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-1/2 h-px bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 animate-pulse"></div>
          <div className="absolute top-2/3 right-1/4 w-1/3 h-px bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-1/4 left-1/4 w-1/4 h-px bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
        </div>
        
        {/* Feature 1: Dynamic Knowledge Graph */}
        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="3"></circle>
              <circle cx="6" cy="6" r="3"></circle>
              <path d="M13 6h3a2 2 0 0 1 2 2v7"></path>
              <path d="M11 18H8a2 2 0 0 1-2-2V9"></path>
            </svg>
          }
          title="Dynamic Knowledge Graph"
          description="Your knowledge forms natural connections and evolves into a living ecosystem."
          color="primary"
          features={[
            "Automatic node creation and connection",
            "Visualization of knowledge evolution",
            "Intelligent mapping of related concepts"
          ]}
        />

        {/* Feature 2: Self-Reflection System */}
        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 1 7.92 12.446a1 1 0 0 1-.813.493h-1.5v2.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5v-2.5H4.5a1 1 0 0 1-.813-.493A7.5 7.5 0 0 1 11.607 3Z"></path>
            </svg>
          }
          title="Self-Reflection System"
          description="The system continuously reflects on its knowledge structure and reorganizes itself."
          color="blue"
          features={[
            "Autonomous knowledge optimization",
            "Adaptive learning from interactions",
            "Pattern recognition and enhancement"
          ]}
        />

        {/* Feature 3: Emergent Intelligence */}
        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          }
          title="Emergent Intelligence"
          description="Experience a system that recognizes patterns and generates new insights automatically."
          color="purple"
          features={[
            "Novel insight generation",
            "Surprising connections discovery",
            "Knowledge gap identification"
          ]}
        />
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'blue' | 'purple' | 'green';
  features: string[];
}

function FeatureCard({ icon, title, description, color, features }: FeatureCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return {
          border: 'border-primary/10 hover:border-primary/30',
          bg: 'bg-primary/20',
          text: 'text-primary'
        };
      case 'blue':
        return {
          border: 'border-blue-500/10 hover:border-blue-500/30',
          bg: 'bg-blue-500/20',
          text: 'text-blue-500'
        };
      case 'purple':
        return {
          border: 'border-purple-500/10 hover:border-purple-500/30',
          bg: 'bg-purple-500/20',
          text: 'text-purple-500'
        };
      case 'green':
        return {
          border: 'border-green-500/10 hover:border-green-500/30',
          bg: 'bg-green-500/20',
          text: 'text-green-500'
        };
      default:
        return {
          border: 'border-primary/10 hover:border-primary/30',
          bg: 'bg-primary/20',
          text: 'text-primary'
        };
    }
  };

  const colors = getColorClasses(color);

  return (
    <div className={`p-8 bg-card/40 backdrop-blur-md rounded-xl shadow-lg border ${colors.border} transition-all group`}>
      <div className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-foreground/80 mb-4">{description}</p>
      <ul className="space-y-2 text-sm text-foreground/70">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className={`w-5 h-5 ${colors.text} mr-2 mt-0.5`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
