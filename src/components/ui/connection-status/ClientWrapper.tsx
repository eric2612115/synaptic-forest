'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Import component with special handling for default exports
const ConnectionStatusIndicator = dynamic(
  () => import('./index'),
  { 
    ssr: false,
    // Provide a loading fallback
    loading: () => (
      <div className="fixed bottom-4 right-4 z-50 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-md shadow-lg opacity-50">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-gray-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Loading...</span>
        </div>
      </div>
    )
  }
);

export default function ClientConnectionStatusWrapper() {
  // Wrap in Suspense as an extra safety measure
  return (
    <Suspense fallback={null}>
      <ConnectionStatusIndicator />
    </Suspense>
  );
}
