import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  
  // 返回模拟的系统健康状态数据
  return NextResponse.json({
    overall_quality: 0.87,
    metrics: {
      avg_certainty_score: 0.85,
      graph_density: 0.72,
      topic_entropy: 1.2,
      dormant_node_ratio: 0.15
    },
    rules: {
      passed: 18,
      warnings: 3,
      failed: 0
    },
    improvements: [
      "添加更多的因果关系连接以提高知识深度",
      "增加跨主题的连接以提高创造性潜力",
      "定期更新休眠节点以保持知识时效性"
    ],
    last_reflection_cycle: {
      id: "refl-1234567",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      duration_seconds: 124,
      improvements_made: 7
    }
  });
}
