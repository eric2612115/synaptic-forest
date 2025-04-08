'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useAuth } from '@/hooks';

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useAppSelector(state => state.ui);
  const dispatch = useAppDispatch();
  const { user, logout } = useAuth();
  
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
        </svg>
      ),
    },
    {
      name: 'Knowledge Forest',
      path: '/forest',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16.2 7.8C12.4 4 5.5 9.5 8.2 15.5c2.2 4.9 8.1 6.3 11.7 2.7"></path>
          <path d="M8.2 7.8c3.8-3.8 10.7 1.7 8 7.7-2.2 4.9-8.1 6.3-11.7 2.7"></path>
        </svg>
      ),
    },
    {
      name: 'Conversation',
      path: '/conversation',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M14 19c3.771 0 5.657 0 6.828-1.172C22 16.657 22 14.771 22 11c0-3.771 0-5.657-1.172-6.828C19.657 3 17.771 3 14 3h-4C6.229 3 4.343 3 3.172 4.172 2 5.343 2 7.229 2 11c0 3.771 0 5.657 1.172 6.828.653.654 1.528.943 2.828 1.07"></path>
          <path d="M14 19c-1.236 0-2.598.5-3.841 1.145-1.998 1.037-2.997 1.556-3.489 1.225-.492-.33-.399-1.355-.212-3.404L6.5 17.5"></path>
          <path d="M7 8h10"></path>
          <path d="M7 12h4"></path>
        </svg>
      ),
    },
    {
      name: 'Reflection',
      path: '/reflection',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 1 7.92 12.446a1 1 0 0 1-.813.493h-1.5v2.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5v-2.5H4.5a1 1 0 0 1-.813-.493A7.5 7.5 0 0 1 11.607 3Z"></path>
        </svg>
      ),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <aside 
      className="fixed top-0 left-0 z-40 h-screen bg-card text-card-foreground shadow-md
               transition-all duration-300 ease-in-out border-r"
      style={{ width: sidebarOpen ? '16rem' : '5rem' }} // 使用内联样式而不是动态类
    >
      <div className="flex h-full flex-col">
        <div className={`flex items-center justify-between p-4 ${sidebarOpen ? 'px-4' : 'px-2'}`}>
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary-foreground">
                <path d="M21 9V3H15"></path>
                <path d="M15 21V15H9"></path>
                <path d="M3 15V21H9"></path>
                <path d="M9 3V9H3"></path>
                <path d="m21 3-6 6"></path>
                <path d="m21 21-6-6"></path>
                <path d="m3 3 6 6"></path>
                <path d="m3 21 6-6"></path>
              </svg>
            </div>
            {sidebarOpen && <span className="text-xl font-semibold">Synaptic</span>}
          </Link>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1 rounded-full hover:bg-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              {sidebarOpen ? (
                <>
                  <path d="m15 6-6 6 6 6"></path>
                </>
              ) : (
                <>
                  <path d="m9 6 6 6-6 6"></path>
                </>
              )}
            </svg>
          </button>
        </div>

        <div className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`
                    flex items-center p-3 rounded-lg hover:bg-secondary group
                    ${isActive(item.path) ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground'}
                    ${sidebarOpen ? 'justify-start space-x-3' : 'justify-center'}
                    transition-colors duration-200
                  `}
                >
                  <div className={`${isActive(item.path) ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.icon}
                  </div>
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t p-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {user?.username.substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-md hover:bg-secondary"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.username.substring(0, 1).toUpperCase()}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-md hover:bg-secondary"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
