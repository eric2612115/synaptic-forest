'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Sun, Moon, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 在客户端组件中使用dynamic加载是安全的
const TopNavbar = dynamic(
  () => import('@/components/ui/top-navbar').then(mod => mod.TopNavbar),
  { ssr: false }
);

export function ClientNavbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  
  const isHomePage = pathname === '/';

  // 确保在客户端渲染时再加载组件，避免hydration错误
  useEffect(() => {
    setMounted(true);

    // Add scroll listener for transparent navbar on homepage
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (isHomePage) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isHomePage]);

  if (!mounted) {
    // Return placeholder to avoid layout shift
    return null;
  }

  // Determine navbar styles based on homepage and scroll position
  const navbarClasses = isHomePage
    ? scrolled
      ? "sticky top-0 w-full z-50 bg-background/80 backdrop-blur-sm shadow-sm transition-all duration-300"
      : "sticky top-0 w-full z-50 bg-transparent transition-all duration-300"
    : "sticky top-0 w-full z-50 bg-background/90 backdrop-blur-sm shadow-sm border-b";

  return (
    <header className={navbarClasses}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/" 
            className={`text-xl font-semibold transition-colors ${isHomePage && !scrolled ? 'text-white hover:text-primary/90' : 'hover:text-primary'}`}
          >
            Synaptic Forest
          </Link>
        </div>
        
        {/* 桌面导航 */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors ${isHomePage && !scrolled ? 'text-white/90 hover:text-white' : 'hover:text-primary'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/forest" 
              className={`text-sm font-medium transition-colors ${isHomePage && !scrolled ? 'text-white/90 hover:text-white' : 'hover:text-primary'}`}
            >
              Knowledge Forest
            </Link>
            <Link 
              href="/conversation" 
              className={`text-sm font-medium transition-colors ${isHomePage && !scrolled ? 'text-white/90 hover:text-white' : 'hover:text-primary'}`}
            >
              Chat
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-full transition-colors ${isHomePage && !scrolled ? 'hover:bg-white/20 text-white' : 'hover:bg-secondary'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <Link 
              href="/login" 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isHomePage && !scrolled ? 'bg-white/20 text-white hover:bg-white/30' : 'text-primary-foreground bg-primary hover:bg-primary/90'}`}
            >
              Login
            </Link>
            
            <Link 
              href="/register" 
              className="px-4 py-2 text-sm font-medium text-background bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
        
        {/* 移动端菜单按钮 */}
        <button
          className={`md:hidden p-2 rounded-md ${isHomePage && !scrolled ? 'text-white hover:bg-white/20' : 'hover:bg-secondary'}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-3 space-y-3 bg-background/95 backdrop-blur-md border-b">
          <Link href="/dashboard" className="block py-2 hover:text-primary">
            Dashboard
          </Link>
          <Link href="/forest" className="block py-2 hover:text-primary">
            Knowledge Forest
          </Link>
          <Link href="/conversation" className="block py-2 hover:text-primary">
            Chat
          </Link>
          <div className="flex items-center justify-between pt-2 border-t">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="flex space-x-2">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium text-background bg-blue-500 hover:bg-blue-600 rounded-md transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
