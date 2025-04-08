'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { setTheme, toggleThinking, setShowThinking, toggleDemoMode } from '@/store/slices/uiSlice';
import { useAuth } from '@/hooks';
import { SmartConnectionStatus } from '@/components/ui/smart-connection-status';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, showThinking, demoMode } = useAppSelector(state => state.ui);
  const { energy } = useAppSelector(state => state.system);
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, logout } = useAuth(false); // false不強制重定向

  const getTitle = () => {
    if (pathname.startsWith('/dashboard')) {
      return 'Dashboard';
    } else if (pathname.startsWith('/forest')) {
      return 'Knowledge Forest';
    } else if (pathname.startsWith('/conversation')) {
      return 'Conversations';
    } else if (pathname.startsWith('/reflection')) {
      return 'System Reflection';
    } else if (pathname.startsWith('/settings')) {
      return 'Settings';
    }
    return 'Synaptic Forest';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 實際的搜索邏輯
    console.log('Searching for:', searchQuery);
  };
  
  // 點擊外部時關閉用戶菜單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center bg-card shadow-sm border-b">
      <div className="container mx-auto flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold">{getTitle()}</h1>

        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <input
                type="search"
                className="px-3 py-2 pl-10 pr-4 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-input w-64"
                placeholder="Search knowledge or conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* 智能连接状态指示灯 */}
          <SmartConnectionStatus className="hidden md:flex" />

          {/* 能量指示器 */}
          {energy && (
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-32 bg-secondary rounded-full h-2.5">
                <div 
                  className="bg-[hsl(var(--concept))] h-2.5 rounded-full" 
                  style={{ width: `${(energy.current_energy / energy.max_energy) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(energy.current_energy)}/{energy.max_energy} Energy
              </span>
            </div>
          )}

          {/* 主題切換 */}
          <div className="relative">
            <button
              onClick={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))}
              className="p-2 rounded-md hover:bg-secondary"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="m4.93 4.93 1.41 1.41"></path>
                  <path d="m17.66 17.66 1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="m6.34 17.66-1.41 1.41"></path>
                  <path d="m19.07 4.93-1.41 1.41"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
              )}
            </button>
          </div>

          {/* 思考模式切換器 */}
          <button
            onClick={() => dispatch(toggleThinking())}
            className={`p-2 rounded-md hover:bg-secondary hidden md:block ${showThinking ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            title="Toggle thinking mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" x2="9.01" y1="9" y2="9"></line>
              <line x1="15" x2="15.01" y1="9" y2="9"></line>
            </svg>
          </button>

          {/* 演示模式切換器 */}
          <button
            onClick={() => dispatch(toggleDemoMode())}
            className={`p-2 rounded-md hover:bg-secondary ${demoMode ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            title="Toggle demo mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"></path>
              <path d="M17.64 15 22 10.64"></path>
              <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"></path>
            </svg>
          </button>
          
          {/* 用戶菜單 / 登入按鈕 */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-1 ml-2 p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium hidden md:block">{user?.username || 'User'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 hidden md:block">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50 overflow-hidden">
                  <div className="p-2 border-b">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <ul className="py-1">
                    <li>
                      <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm hover:bg-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                        </svg>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Settings
                      </Link>
                    </li>
                    <li className="border-t">
                      <button 
                        onClick={logout}
                        className="flex w-full items-center px-4 py-2 text-sm hover:bg-secondary text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" x2="9" y1="12" y2="12"></line>
                        </svg>
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 ml-2">
              <Link 
                href="/login"
                className="px-4 py-2 text-sm rounded-md border border-input hover:bg-secondary transition-colors"
              >
                Sign in
              </Link>
              <Link 
                href="/register"
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
