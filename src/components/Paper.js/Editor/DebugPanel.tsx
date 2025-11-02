"use client";
import { useRef, useState } from "react";

interface DebugPanelProps {
  showDebug: boolean;
  markdown: string;
}

export default function DebugPanel({ showDebug, markdown }: DebugPanelProps) {
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(0.6); // left pane ratio (0-1)
  const [isResizing, setIsResizing] = useState(false);

  if (!showDebug) return null;

  return (
    <>
      {/* Vertical splitter */}
      <div
        role="separator"
        aria-orientation="vertical"
        className={`w-1 cursor-col-resize bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 ${isResizing ? 'opacity-100' : 'opacity-100'}`}
        onMouseDown={() => setIsResizing(true)}
        style={{
          userSelect: 'none'
        }}
      />

      <div className="flex flex-col border-l border-gray-200 dark:border-gray-700" style={{ width: `${(1 - splitRatio) * 100}%` }}>
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Variable Markdown (Debug)</span>
        </div>
        <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800">
          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {markdown || '(vide)'}
          </pre>
        </div>
      </div>
    </>
  );
}
