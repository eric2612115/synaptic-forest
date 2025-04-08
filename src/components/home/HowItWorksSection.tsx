'use client';

export default function HowItWorksSection() {
  return (
    <section className="py-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">How It Works</h2>
      <p className="text-xl text-center mb-16 max-w-3xl mx-auto text-foreground/80">
        Synaptic Forest combines several innovative technologies to create a true knowledge ecosystem
      </p>
      
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1">
          <h3 className="text-2xl font-semibold mb-4">Natural Knowledge Growth</h3>
          <p className="text-foreground/80 mb-6">
            Just as a forest grows through natural processes of germination, growth, and interconnection, 
            Synaptic Forest builds a knowledge ecosystem that evolves organically from your interactions.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="bg-primary/20 rounded-full p-1 mr-3 mt-1">
                <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Knowledge Extraction</h4>
                <p className="text-sm text-foreground/70">Information is automatically extracted from conversations and structured into nodes</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-primary/20 rounded-full p-1 mr-3 mt-1">
                <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Connection Formation</h4>
                <p className="text-sm text-foreground/70">Relationships between ideas are established, creating a living network of knowledge</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-primary/20 rounded-full p-1 mr-3 mt-1">
                <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Continuous Evolution</h4>
                <p className="text-sm text-foreground/70">Your knowledge forest adapts and grows with every interaction</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="order-1 md:order-2 relative">
          <div className="relative w-full h-[400px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg opacity-30"></div>
            <div className="neural-pulse absolute w-32 h-32 rounded-full bg-blue-500/20 top-1/4 left-1/4"></div>
            <div className="neural-pulse animation-delay-500 absolute w-24 h-24 rounded-full bg-indigo-500/20 bottom-1/4 right-1/3"></div>
            <div className="neural-pulse animation-delay-700 absolute w-20 h-20 rounded-full bg-purple-500/20 top-1/3 right-1/4"></div>
            
            <svg className="w-full h-full absolute" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <path className="neural-path opacity-50" d="M100,120 Q200,50 300,150" stroke="url(#gradient1)" strokeWidth="1" fill="none" />
              <path className="neural-path opacity-50 animation-delay-500" d="M150,250 Q240,150 300,250" stroke="url(#gradient2)" strokeWidth="1" fill="none" />
              <path className="neural-path opacity-50 animation-delay-700" d="M100,200 Q180,280 280,180" stroke="url(#gradient3)" strokeWidth="1" fill="none" />
              
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0.5)" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(79, 70, 229, 0.5)" />
                  <stop offset="100%" stopColor="rgba(236, 72, 153, 0.5)" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.5)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.5)" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="knowledge-node absolute top-[120px] left-[100px] w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center shadow-lg z-10">
              <span className="text-xs font-medium">Concept</span>
            </div>
            <div className="knowledge-node animation-delay-400 absolute top-[150px] right-[100px] w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 flex items-center justify-center shadow-lg z-10">
              <span className="text-xs font-medium">Entity</span>
            </div>
            <div className="knowledge-node animation-delay-700 absolute bottom-[100px] left-[150px] w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700 flex items-center justify-center shadow-lg z-10">
              <span className="text-xs font-medium">Relation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
