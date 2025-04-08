'use client';

import { Suspense, lazy } from 'react';
import { KnowledgeNode, KnowledgeEdge } from '@/types';

// 懒加载NetworkView组件
const NetworkView = lazy(() => import('./NetworkView'));

interface ClientNetworkViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

export default function ClientNetworkView(props: ClientNetworkViewProps) {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading Network View...</div>
      </div>
    }>
      <NetworkView {...props} />
    </Suspense>
  );
}
