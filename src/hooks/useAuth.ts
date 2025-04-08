import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { fetchCurrentUser, logout, setAuthenticated } from '@/store/slices/authSlice';

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, isLoading, error } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    // 防止重定向循环
    let shouldRedirect = true;
    
    // 添加调试日志看状态
    console.log('useAuth effect running with:', { 
      isAuthenticated, 
      hasToken: !!localStorage.getItem('access_token'),
      pathname: window.location.pathname,
      isLoading, 
      requireAuth,
      user
    });
    
    // 预先校验 token 确保状态一致
    const token = localStorage.getItem('access_token');
    if (token && !isAuthenticated && !isLoading) {
      console.log('Found token but not authenticated, fixing state...');
      dispatch(setAuthenticated(true));
      return; // 等待状态更新后再继续
    }
    
    // 如果用户已经认证，但没有用户数据，则创建默认用户数据
    // 暂时注释掉API调用，因为后端不支持 /api/auth/me 端点
    if (isAuthenticated && !user && !isLoading) {
      console.warn('User authenticated but data not available - using default user');
      // 创建一个默认用户数据而不是调用API
      const username = localStorage.getItem('username') || 'user123';
      dispatch({
        type: 'auth/fetchCurrentUser/fulfilled',
        payload: {
          id: username,
          username: username,
          email: `${username}@example.com`
        }
      });
      // dispatch(fetchCurrentUser()); // 暂时不调用这个API
    }
    
    // 添加延迟确保状态稳定
    const redirectDelayMs = 300; // 给更多时间确保状态更新
    
    // 使用 requestAnimationFrame 确保矩阵渲染更新完成
    const handleRedirect = () => {
      // 再次检查状态，以防状态已经变化
      const currentToken = localStorage.getItem('access_token');
      const currentPathname = window.location.pathname;
      
      // 已经登入但在登入页面
      if ((isAuthenticated || currentToken) && shouldRedirect && 
          (currentPathname === '/login' || currentPathname === '/register')) {
        console.log('Redirecting authenticated user to dashboard');
        router.push('/dashboard');
        return;
      }
      
      // 需要登入但未认证
      if (requireAuth && !isAuthenticated && !currentToken && !isLoading && shouldRedirect) {
        console.log('Redirecting unauthenticated user to login');
        router.push('/login');
      }
    };
    
    // 使用 setTimeout 避免矩阵在组件未完全加载时就跳转
    const redirectTimeout = setTimeout(() => {
      requestAnimationFrame(handleRedirect);
    }, redirectDelayMs);
    
    // 清理函数
    return () => {
      shouldRedirect = false;
      clearTimeout(redirectTimeout);
    };
  }, [isAuthenticated, user, isLoading, requireAuth, router, dispatch]);

  const handleLogout = () => {
    try {
      dispatch(logout());
      
      // 安全地重定向到登录页
      requestAnimationFrame(() => {
        console.log('Logging out user, redirecting to login page');
        router.push('/login');
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // 确保即使发生错误也会跳转到登录页
      window.location.href = '/login';
    }
  };
  
  // 強制登出，用於後端無法連接的情況
  const forceLocalLogout = () => {
    try {
      // 只清除本地存儲，不嘗試調用API
      localStorage.removeItem('access_token');
      localStorage.removeItem('username');
      
      // 更新Redux狀態
      dispatch({ type: 'auth/logout/fulfilled' });
      
      // 安全地重定向到登录页
      requestAnimationFrame(() => {
        console.log('Force local logout due to API unavailability');
        router.push('/login');
      });
    } catch (error) {
      console.error('Error during force logout:', error);
      window.location.href = '/login';
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout: handleLogout,
    forceLocalLogout, // 將強制登出功能暱露給元件使用
  };
}
