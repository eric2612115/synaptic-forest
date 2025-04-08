import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  
  // 返回模拟的能源状态数据
  return NextResponse.json({
    current_level: 85,
    max_level: 100,
    generation_rate: 5,
    consumption_rate: 3,
    last_updated: new Date().toISOString(),
    allocations: {
      conversation: 40,
      knowledge_extraction: 30,
      reflection: 20,
      maintenance: 10
    },
    history: [
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        level: 75
      },
      {
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        level: 80
      },
      {
        timestamp: new Date().toISOString(),
        level: 85
      }
    ]
  });
}
