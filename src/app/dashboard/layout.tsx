'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useAppDispatch } from '@/hooks';
import { setCurrentView } from '@/store/slices/uiSlice';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useAuth(true);
  const dispatch = useAppDispatch();
  
  // 设置当前视图为仪表板
  useEffect(() => {
    dispatch(setCurrentView('dashboard'));
  }, [dispatch]);

  // 认证加载中或未认证时显示加载画面
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-slow text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {children}
    </div>
  );
}
