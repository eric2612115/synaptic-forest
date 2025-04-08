'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function TopNavbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 w-full z-50 bg-background/90 backdrop-blur-sm shadow-sm border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-semibold hover:text-primary transition-colors">
            Synaptic Forest
          </Link>
        </div>
        
        <div className="flex items-center space-x-6">
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/forest" className="text-sm font-medium hover:text-primary transition-colors">
              Knowledge Forest
            </Link>
            <Link href="/conversation" className="text-sm font-medium hover:text-primary transition-colors">
              Chat
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
