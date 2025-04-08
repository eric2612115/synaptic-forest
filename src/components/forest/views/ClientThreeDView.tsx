'use client';

import { Suspense, lazy } from 'react';
import { KnowledgeNode, KnowledgeEdge } from '@/types';

// 懒加载ThreeDView组件
const ThreeDView = lazy(() => import('./ThreeDView'));

interface ClientThreeDViewProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeClick: (node: KnowledgeNode) => void;
  detailLevel: 'low' | 'medium' | 'high';
}

export default function ClientThreeDView(props: ClientThreeDViewProps) {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading 3D View...</div>
      </div>
    }>
      <ThreeDView {...props} />
    </Suspense>
  );
}
