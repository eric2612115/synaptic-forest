'use client';

import Link from 'next/link';

export default function CallToActionSection() {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 text-center border border-primary/10 shadow-xl">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Begin Your Knowledge Journey</h2>
      <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
        Step into a revolutionary knowledge ecosystem that evolves with your thoughts and helps you discover unexpected connections.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/register" className="px-8 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          Start Exploring
        </Link>
        <Link href="/docs" className="px-8 py-3 rounded-full bg-muted/50 text-foreground hover:bg-muted transition-all">
          Learn More
        </Link>
      </div>
    </div>
  );
}
