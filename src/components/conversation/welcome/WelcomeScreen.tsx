'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import chatWebSocketClient from '@/lib/websocket/chat-client';

const examples = [
  "Explain how neural networks build knowledge representations",
  "Help me understand the concept of distributed systems",
  "What are the key principles of knowledge graphs?",
  "Compare different approaches to building AI agents",
  "Suggest a structure for organizing research notes"
];

export function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  
  const startConversationWithPrompt = async (prompt?: string) => {
    if (!user?.id) return;
    
    try {
      setIsCreating(true);
      
      // Create new conversation
      const conversation = await chatWebSocketClient.createConversation(user.id);
      
      // If there's a prompt, we'll navigate to the conversation and let the
      // conversation page component handle sending it
      router.push(`/conversation/${conversation.id}${prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''}`);
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setIsCreating(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col justify-center items-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Synaptic Forest</h1>
          <p className="text-muted-foreground text-lg">
            Your interactive knowledge ecosystem powered by AI
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* New conversation card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card border rounded-xl shadow-sm p-6 hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-semibold mb-4">Start a new conversation</h2>
            <p className="text-muted-foreground mb-6">
              Begin building your knowledge forest by starting a conversation about any topic.
            </p>
            <button
              onClick={() => startConversationWithPrompt()}
              disabled={isCreating}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Creating...
                </div>
              ) : 'New conversation'}
            </button>
          </motion.div>
          
          {/* Knowledge forest card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card border rounded-xl shadow-sm p-6 hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-semibold mb-4">Explore your knowledge forest</h2>
            <p className="text-muted-foreground mb-6">
              Visualize how your conversations form an interconnected knowledge network.
            </p>
            <button
              onClick={() => router.push('/forest')}
              className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              View forest
            </button>
          </motion.div>
        </div>
        
        {/* Example prompts */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Try an example:</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {examples.map((example, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startConversationWithPrompt(example)}
                disabled={isCreating}
                className="text-left p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
              >
                "{example}"
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default WelcomeScreen;