'use client';

import React from 'react';

const ConnectionStatusIndicator = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-md shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium text-green-800 dark:text-green-200">Connected</span>
      </div>
    </div>
  );
};

// Make sure to export as default
export default ConnectionStatusIndicator;
