"use client";
import { useRef, useState, useEffect } from "react";

interface DebugPanelProps {
  showDebug: boolean;
  markdown: string;
  editorRef?: React.RefObject<HTMLDivElement | null>;
  markdownConverter?: any;
}

export default function DebugPanel({ showDebug, markdown, editorRef, markdownConverter }: DebugPanelProps) {
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(0.6); // left pane ratio (0-1)
  const [isResizing, setIsResizing] = useState(false);
  const [displayMarkdown, setDisplayMarkdown] = useState(markdown);

  // Update display markdown from editor HTML in real-time if available
  useEffect(() => {
    if (!showDebug || !editorRef?.current || !markdownConverter) {
      setDisplayMarkdown(markdown);
      return;
    }

    // Update from prop markdown
    setDisplayMarkdown(markdown);

    // Also update in real-time from editor HTML
    const updateFromEditor = () => {
      if (editorRef.current && markdownConverter) {
        try {
          const html = editorRef.current.innerHTML;
          const realTimeMarkdown = markdownConverter.htmlToMarkdown(html);
          setDisplayMarkdown(realTimeMarkdown);
        } catch (e) {
          // Fallback to prop markdown if conversion fails
          setDisplayMarkdown(markdown);
        }
      }
    };

    // Update immediately
    updateFromEditor();

    // Set up interval to update in real-time
    const interval = setInterval(updateFromEditor, 100);

    return () => clearInterval(interval);
  }, [showDebug, markdown, editorRef, markdownConverter]);

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
            {displayMarkdown || '(vide)'}
          </pre>
        </div>
      </div>
    </>
  );
}
