'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LightNeuralBackground } from '@/components/visualization/light-neural-background';

// 文档目录定义
const documentationSections = [
  {
    title: "Getting Started",
    links: [
      { title: "Introduction", id: "introduction" },
      { title: "Core Concepts", id: "core-concepts" },
      { title: "Installation", id: "installation" },
      { title: "Quick Start Guide", id: "quick-start" }
    ]
  },
  {
    title: "Knowledge Forest",
    links: [
      { title: "Forest Visualization", id: "forest-visualization" },
      { title: "Navigating the Forest", id: "navigating" },
      { title: "Node Types & Relationships", id: "node-types" },
      { title: "Search & Filter", id: "search-filter" }
    ]
  },
  {
    title: "Conversations",
    links: [
      { title: "Starting a Conversation", id: "start-conversation" },
      { title: "Knowledge Extraction", id: "knowledge-extraction" },
      { title: "Advanced Prompting", id: "advanced-prompting" },
      { title: "Conversation History", id: "conversation-history" }
    ]
  },
  {
    title: "Reflection System",
    links: [
      { title: "Understanding Reflection", id: "understanding-reflection" },
      { title: "Energy System", id: "energy-system" },
      { title: "Reflection Cycles", id: "reflection-cycles" },
      { title: "Optimizing Knowledge", id: "optimizing-knowledge" }
    ]
  },
  {
    title: "Advanced Usage",
    links: [
      { title: "API Integration", id: "api-integration" },
      { title: "Custom Extensions", id: "custom-extensions" },
      { title: "Importing & Exporting", id: "importing-exporting" },
      { title: "Multi-user Collaboration", id: "multi-user" }
    ]
  }
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Background */}
      <LightNeuralBackground />
      <div className="fixed inset-0 bg-gradient-radial from-transparent to-background/30 -z-5"></div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 flex-shrink-0 bg-card/20 backdrop-blur-md p-4 rounded-lg border border-indigo-500/10 self-start sticky top-8">
            <h3 className="text-xl font-bold text-indigo-500 mb-6">Documentation</h3>
            <nav className="space-y-8">
              {documentationSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="font-medium text-foreground/80">{section.title}</h4>
                  <ul className="space-y-1 pl-2">
                    {section.links.map((link) => (
                      <li key={link.id}>
                        <button
                          onClick={() => setActiveSection(link.id)}
                          className={`w-full text-left px-2 py-1 rounded text-sm ${
                            activeSection === link.id
                              ? "bg-indigo-500 text-white"
                              : "hover:bg-indigo-500/10 text-foreground/70"
                          }`}
                        >
                          {link.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-card/20 backdrop-blur-md p-6 rounded-lg border border-indigo-500/10">
            <DocsContent activeSection={activeSection} />
          </main>
        </div>
      </div>
    </div>
  );
}

// 文档内容组件
function DocsContent({ activeSection }: { activeSection: string }) {
  // Main sections content
  const contentSections = {
    // Getting Started
    introduction: (
      <div>
        <h1 className="text-3xl font-bold mb-6 text-indigo-500">Introduction to Synaptic Forest</h1>
        <p className="mb-4">
          Welcome to Synaptic Forest, a revolutionary knowledge ecosystem that adapts and evolves with your thoughts. Unlike traditional note-taking or knowledge management systems, Synaptic Forest creates a living, dynamic representation of your knowledge that grows organically through your interactions.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">What Makes Synaptic Forest Different</h2>
        <p className="mb-4">
          Synaptic Forest combines advanced AI with innovative knowledge representation techniques to create a system that doesn't just store information but actively processes it, finding connections, identifying patterns, and even generating new insights.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Key Features</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Dynamic Knowledge Graphs</strong> - Visualize your knowledge as an interconnected network that reveals relationships and patterns</li>
          <li><strong>Self-Reflection System</strong> - The system regularly reviews and optimizes its knowledge structure, just like human reflection</li>
          <li><strong>Natural Conversations</strong> - Interact with your knowledge through natural conversations rather than rigid queries</li>
          <li><strong>Emergent Intelligence</strong> - Experience insights and connections that emerge naturally from the system's structure</li>
        </ul>
        
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-indigo-600 mb-2">Quick Tip</h4>
          <p className="text-sm">
            The best way to understand Synaptic Forest is to experience it. Try starting a conversation and watching how the knowledge forest grows and evolves as you add new information.
          </p>
        </div>
      </div>
    ),
    
    "core-concepts": (
      <div>
        <h1 className="text-3xl font-bold mb-6 text-indigo-500">Core Concepts</h1>
        <p className="mb-6">
          Understanding the fundamental concepts behind Synaptic Forest will help you get the most out of this innovative knowledge system.
        </p>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-3">The Knowledge Forest</h2>
            <p>
              At the heart of the system is the Knowledge Forest – a visual representation of your knowledge as an interconnected ecosystem. Like a natural forest, it contains diverse elements that interact and support each other:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li><strong>Nodes</strong> represent individual concepts, facts, or ideas</li>
              <li><strong>Edges</strong> show the relationships between nodes</li>
              <li><strong>Clusters</strong> form naturally around related concepts</li>
              <li><strong>Abstractions</strong> emerge from patterns in the knowledge network</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-3">Self-Reflection Cycle</h2>
            <p>
              Inspired by human cognitive processes, Synaptic Forest includes a reflection system that regularly reviews and optimizes its knowledge structure:
            </p>
            <ol className="list-decimal pl-6 mt-3 space-y-1">
              <li><strong>Observation</strong> - The system examines the current state of knowledge</li>
              <li><strong>Evaluation</strong> - It identifies patterns, gaps, and opportunities for improvement</li>
              <li><strong>Decision</strong> - Based on evaluation, it determines what changes to make</li>
              <li><strong>Execution</strong> - The system implements changes to optimize knowledge structure</li>
            </ol>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-3">Energy System</h2>
            <p>
              The energy system regulates how much computational resources are allocated to different processes:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li><strong>Knowledge Extraction</strong> - Energy used to extract knowledge from conversations</li>
              <li><strong>Relationship Forming</strong> - Energy allocated to discovering connections</li>
              <li><strong>Abstraction Creation</strong> - Energy spent on forming higher-level concepts</li>
              <li><strong>Reflection Cycles</strong> - Energy dedicated to system-wide optimization</li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-3">Emergent Properties</h2>
            <p>
              Perhaps the most fascinating aspect of Synaptic Forest is how it exhibits emergent properties – behaviors and capabilities that aren't explicitly programmed but arise from the system's structure and processes:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li><strong>Cross-domain insights</strong> - Connections between seemingly unrelated fields</li>
              <li><strong>Knowledge gaps</strong> - Identification of missing information</li>
              <li><strong>Conceptual evolution</strong> - How ideas change and develop over time</li>
              <li><strong>Analogical reasoning</strong> - Finding similarities between different concepts</li>
            </ul>
          </div>
        </div>
      </div>
    ),
    
    // Knowledge Forest
    "forest-visualization": (
      <div>
        <h1 className="text-3xl font-bold mb-6 text-indigo-500">Forest Visualization</h1>
        <p className="mb-4">
          The Synaptic Forest visualization is your window into the living knowledge ecosystem. It provides intuitive ways to explore, interact with, and understand your knowledge network.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Visualization Modes</h2>
        <p className="mb-4">
          The system offers multiple visualization modes, each providing a different perspective on your knowledge:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card/30 p-4 rounded-lg border border-indigo-500/10">
            <h3 className="text-lg font-semibold text-indigo-500 mb-2">Network View</h3>
            <p className="text-sm">
              The classic network visualization showing nodes and connections. Best for exploring relationships and connections between concepts.
            </p>
          </div>
          
          <div className="bg-card/30 p-4 rounded-lg border border-indigo-500/10">
            <h3 className="text-lg font-semibold text-indigo-500 mb-2">3D Forest</h3>
            <p className="text-sm">
              An immersive 3D visualization that represents your knowledge as a living ecosystem. Provides the most natural representation of knowledge growth and evolution.
            </p>
          </div>
          
          <div className="bg-card/30 p-4 rounded-lg border border-indigo-500/10">
            <h3 className="text-lg font-semibold text-indigo-500 mb-2">Cluster View</h3>
            <p className="text-sm">
              Organizes knowledge into thematic clusters, making it easier to explore related concepts and identify major knowledge areas.
            </p>
          </div>
          
          <div className="bg-card/30 p-4 rounded-lg border border-indigo-500/10">
            <h3 className="text-lg font-semibold text-indigo-500 mb-2">Timeline View</h3>
            <p className="text-sm">
              Shows how your knowledge has evolved over time, allowing you to track the development of ideas and the growth of your knowledge base.
            </p>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Visual Elements</h2>
        <p className="mb-4">
          The forest visualization uses various visual elements to represent different aspects of your knowledge:
        </p>
        
        <table className="w-full mt-4 border-collapse">
          <thead className="bg-indigo-500/10">
            <tr>
              <th className="border border-indigo-500/20 px-4 py-2 text-left">Element</th>
              <th className="border border-indigo-500/20 px-4 py-2 text-left">Represents</th>
              <th className="border border-indigo-500/20 px-4 py-2 text-left">Visual Encoding</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-indigo-500/20 px-4 py-2">Nodes</td>
              <td className="border border-indigo-500/20 px-4 py-2">Concepts, entities, ideas</td>
              <td className="border border-indigo-500/20 px-4 py-2">Shape, color, size</td>
            </tr>
            <tr>
              <td className="border border-indigo-500/20 px-4 py-2">Edges</td>
              <td className="border border-indigo-500/20 px-4 py-2">Relationships, connections</td>
              <td className="border border-indigo-500/20 px-4 py-2">Line style, thickness, color</td>
            </tr>
            <tr>
              <td className="border border-indigo-500/20 px-4 py-2">Clusters</td>
              <td className="border border-indigo-500/20 px-4 py-2">Related concept groups</td>
              <td className="border border-indigo-500/20 px-4 py-2">Proximity, background shading</td>
            </tr>
            <tr>
              <td className="border border-indigo-500/20 px-4 py-2">Animation</td>
              <td className="border border-indigo-500/20 px-4 py-2">Activity, energy flow</td>
              <td className="border border-indigo-500/20 px-4 py-2">Motion, pulse effects</td>
            </tr>
          </tbody>
        </table>
        
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mt-8">
          <h4 className="font-semibold text-indigo-600 mb-2">Visualization Tip</h4>
          <p className="text-sm">
            Try different detail levels when exploring your forest. Use low detail for an overview of major themes and high detail when focusing on specific areas of interest.
          </p>
        </div>
      </div>
    ),
    
    // Default - if section hasn't been implemented yet
    default: (
      <div className="py-8 text-center">
        <h2 className="text-2xl font-bold text-indigo-500 mb-4">Documentation Coming Soon</h2>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          We're currently working on this section of the documentation. 
          Check back soon for detailed information about this feature.
        </p>
        <div className="mt-8">
          <Link href="#introduction" 
            onClick={() => document.getElementById('introduction')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all">
            Return to Introduction
          </Link>
        </div>
      </div>
    )
  };

  // Return the appropriate content or default if not found
  return contentSections[activeSection as keyof typeof contentSections] || contentSections.default;
}
