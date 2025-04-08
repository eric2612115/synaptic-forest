'use client';

import { Suspense, lazy } from 'react';
import { KnowledgeNode, KnowledgeEdge } from '@/types';

// 懒加载TimelineView组件
const TimelineView = lazy(() => import('./TimelineView'));

interface ClientTimelineViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

export default function ClientTimelineView(props: ClientTimelineViewProps) {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading Timeline View...</div>
      </div>
    }>
      <TimelineView {...props} />
    </Suspense>
  );
}
