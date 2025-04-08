'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks';

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth(false); 

  // 關閉下拉菜單的處理函數
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  // 設置點擊外部關閉下拉菜單
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User size={16} />
        </div>
        <span className="text-sm font-medium max-w-32 truncate">{user.username}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg py-1 z-50 border animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
          </div>
          
          <Link href="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-secondary w-full text-left">
            <Settings size={16} className="mr-3 text-muted-foreground" />
            Settings
          </Link>
          
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm hover:bg-secondary w-full text-left text-destructive"
          >
            <LogOut size={16} className="mr-3" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}