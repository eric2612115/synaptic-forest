'use client';

import { Suspense, lazy } from 'react';
import { KnowledgeNode, KnowledgeEdge } from '@/types';

// 懒加载ClusterView组件
const ClusterView = lazy(() => import('./ClusterView'));

interface ClientClusterViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

export default function ClientClusterView(props: ClientClusterViewProps) {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading Cluster View...</div>
      </div>
    }>
      <ClusterView {...props} />
    </Suspense>
  );
}
