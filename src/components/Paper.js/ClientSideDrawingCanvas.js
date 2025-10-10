'use client';

import dynamic from 'next/dynamic';

// Dynamically import the DrawingCanvas with SSR completely disabled
const DrawingCanvas = dynamic(() => import('./DrawingCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="text-gray-500">Loading drawing canvas...</div>
    </div>
  )
});

export default DrawingCanvas;