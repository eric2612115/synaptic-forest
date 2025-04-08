'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch } from '@/hooks';
import { loginUser, setAuthenticated } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { store } from '@/store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // 避免多次重定向的保护措施
  useEffect(() => {
    return () => {
      // 组件卸载时，清除可能的异步操作
      setRedirectInProgress(false);
    };
  }, []);

  const safeNavigate = (path: string) => {
    if (redirectInProgress) return;
    
    setRedirectInProgress(true);
    console.log(`Safely navigating to ${path}`);
    
    // 确保Redux状态先更新，然后才导航
    setTimeout(() => {
      console.log('Auth state before navigation:', { 
        token: localStorage.getItem('access_token'),
        // 检查token确实存在
        isTokenSet: !!localStorage.getItem('access_token')
      });
      
      // 使用 requestAnimationFrame 确保浏览器有时间处理状态更新
      requestAnimationFrame(() => {
        router.push(path);
      });
    }, 100); // 给Redux状态更新留出时间
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || redirectInProgress) {
      console.log('Login already in progress, ignoring request');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Submitting login form with username:', username);
      
      // 使用 fetch 发送登录请求
      const response = await fetch('/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username,
          password
        }),
        credentials: 'include'
      });
        
      console.log('Login response status:', response.status);
        
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, received data');
        
        // 存储令牌和用户名
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('username', username); // 保存用户名以便后续使用
          
          // 更新 Redux 状态，确保设置 isAuthenticated 为 true
          dispatch({
            type: 'auth/loginUser/fulfilled',
            payload: {
              access_token: data.access_token,
              token_type: data.token_type || 'bearer',
              user: data.user || { id: 'user123', username: 'user123' },
              isAuthenticated: true // 明确设置认证状态
            }
          });
          
          // 确保 Redux 知道用户已认证
          dispatch({
            type: 'auth/setAuthenticated',
            payload: true
          });
          
          // 显示成功通知
          dispatch(addNotification({ 
            type: 'success', 
            message: 'Login successful! Welcome back.',
            autoClose: true,
          }));
          
          // 安全导航到仪表板
          safeNavigate('/dashboard');
          return;
        }
      } else {
        console.error('Login failed with status:', response.status);
        throw new Error(`Login failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // 显示错误通知
      dispatch(addNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      }));
      
      // 尝试使用 Redux thunk 作为备选方案
      try {
        console.log('Falling back to Redux thunk login...');
        const resultAction = await dispatch(loginUser({ username, password }));
        
        if (loginUser.fulfilled.match(resultAction)) {
          console.log('Redux thunk login successful');
          dispatch(addNotification({ 
            type: 'success', 
            message: 'Login successful! Welcome back.',
            autoClose: true,
          }));
          
          safeNavigate('/dashboard');
        } else {
          console.log('Redux thunk login failed');
          dispatch(addNotification({ 
            type: 'error', 
            message: resultAction.payload as string || 'Login failed. Please check your credentials.',
          }));
        }
      } catch (fallbackError) {
        console.error('Redux fallback login error:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your Synaptic Forest account</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="remember_me" className="ml-2 block text-sm text-muted-foreground">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="text-primary hover:underline">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isLoading || redirectInProgress}
            >
              {isLoading ? 'Signing in...' : redirectInProgress ? 'Redirecting...' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
      
      {/* Demo mode hint */}
      <div className="mt-8 p-4 bg-secondary/50 rounded-lg max-w-md text-center">
        <h3 className="text-sm font-semibold">Demo Credentials</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Username: <span className="font-mono">user123</span> | 
          Password: <span className="font-mono">forest2024</span>
        </p>
      </div>
    </div>
  );
}
