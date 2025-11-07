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
        className={`w-1 cursor-col-resize bg-border hover:bg-border ${isResizing ? 'opacity-100' : 'opacity-100'}`}
        onMouseDown={() => setIsResizing(true)}
        style={{
          userSelect: 'none'
        }}
      />

      <div className="flex flex-col border-l border-border" style={{ width: `${(1 - splitRatio) * 100}%` }}>
        <div className="bg-muted px-3 py-2 border-b border-border">
          <span className="text-sm font-medium text-foreground">Variable Markdown (Debug)</span>
        </div>
        <div className="flex-1 p-4 bg-muted">
          <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {markdown || '(vide)'}
          </pre>
        </div>
      </div>
    </>
  );
}
