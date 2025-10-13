"use client";
import { useState, useCallback } from "react";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownToolbar from "./Toolbar/MarkdownToolbar";

interface MarkdownNotepadProps {
  initialData?: { text: string };
  onContentChange?: (content: { text: string; drawings: any[]; textFormatting: any; timestamp: number }) => void;
  placeholder?: string;
  className?: string;
}

interface MarkdownFormatting {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  code: boolean;
  heading: number;
  list: 'none' | 'bullet' | 'number';
  quote: boolean;
}

export default function MarkdownNotepad({
  initialData = { text: "" },
  onContentChange,
  placeholder = "Commencez à écrire votre document markdown...",
  className = "",
}: MarkdownNotepadProps) {
  const [markdown, setMarkdown] = useState(initialData.text || "");
  const [formatting, setFormatting] = useState<MarkdownFormatting>({
    bold: false,
    italic: false,
    strikethrough: false,
    code: false,
    heading: 0,
    list: 'none',
    quote: false,
  });

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
  const handleFormatChange = useCallback((format: keyof MarkdownFormatting, value?: any) => {
    // Call the markdown editor's formatting function
    if ((window as any).applyMarkdownFormat) {
      (window as any).applyMarkdownFormat(format, value);
    }
    
    // Update our local state for the toolbar
    if (format === 'heading') {
      setFormatting(prev => ({ ...prev, heading: value || 0 }));
    } else if (format === 'list') {
      setFormatting(prev => ({ ...prev, list: value || 'none' }));
    } else {
      setFormatting(prev => ({ ...prev, [format]: !prev[format] }));
    }
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <MarkdownToolbar
        formatting={formatting}
        onFormatChange={handleFormatChange}
      />

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MarkdownEditor
          content={markdown}
          onContentChange={handleMarkdownChange}
          onFormatChange={handleFormatChange}
          placeholder={placeholder}
          className="h-full"
        />
      </div>
    </div>
  );
}
