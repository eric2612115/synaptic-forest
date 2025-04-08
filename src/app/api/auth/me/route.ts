import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 从URL获取查询参数
  const url = new URL(request.url);
  
  // 获取Authorization头部，如果有的话
  const authHeader = request.headers.get('Authorization');
  let token = '';
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // 返回模拟的用户数据
  return NextResponse.json({
    id: 'user123',
    username: 'user123',
    email: 'user123@example.com',
    created_at: '2024-01-01T00:00:00Z',
    last_login: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      language: 'zh-CN'
    }
  });
}
