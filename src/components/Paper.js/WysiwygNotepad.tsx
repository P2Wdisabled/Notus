"use client";
import { useState, useCallback } from "react";
import WysiwygEditor from "./WysiwygEditor";
import WysiwygToolbar from "./Toolbar/WysiwygToolbar";

interface WysiwygNotepadProps {
  initialData?: { text: string };
  onContentChange?: (content: { text: string; drawings: any[]; textFormatting: any; timestamp: number }) => void;
  placeholder?: string;
  className?: string;
  showDebug?: boolean;
}

export default function WysiwygNotepad({
  initialData = { text: "" },
  onContentChange,
  placeholder = "Commencez à écrire votre document...",
  className = "",
  showDebug = false,
}: WysiwygNotepadProps) {
  const [markdown, setMarkdown] = useState(initialData.text || "");
  const [debugMode, setDebugMode] = useState(showDebug);

  // Handle markdown content change
  const handleMarkdownChange = useCallback((newMarkdown: string) => {
    setMarkdown(newMarkdown);
    
    // Notify parent with the expected format
    if (onContentChange) {
      onContentChange({
        text: newMarkdown,
        drawings: [],
        textFormatting: {},
        timestamp: Date.now(),
      });
    }
  }, [onContentChange]);

  // Handle formatting change
  const handleFormatChange = useCallback((command: string, value?: string) => {
    // Call the wysiwyg editor's formatting function
    if ((window as any).applyWysiwygFormatting) {
      (window as any).applyWysiwygFormatting(command, value);
    }
  }, []);

  // Handle debug toggle
  const handleToggleDebug = useCallback(() => {
    setDebugMode(prev => !prev);
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <WysiwygToolbar
        onFormatChange={handleFormatChange}
        showDebug={debugMode}
        onToggleDebug={handleToggleDebug}
      />

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <WysiwygEditor
          content={markdown}
          onContentChange={handleMarkdownChange}
          placeholder={placeholder}
          className="h-full"
          showDebug={debugMode}
        />
      </div>
    </div>
  );
}
