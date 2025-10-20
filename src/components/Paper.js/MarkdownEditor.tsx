"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MarkdownEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onFormatChange?: (format: keyof MarkdownFormatting, value?: any) => void;
  placeholder?: string;
  className?: string;
}

interface MarkdownFormatting {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  heading: number; // 0 = normal, 1-6 = h1-h6
  list: 'none' | 'bullet' | 'number';
  quote: boolean;
  link: boolean;
  image: boolean;
}

export default function MarkdownEditor({
  content,
  onContentChange,
  onFormatChange,
  placeholder = "Commencez à écrire votre document markdown...",
  className = "",
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(content);
  const [preview, setPreview] = useState("");
  const [formatting, setFormatting] = useState<MarkdownFormatting>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    heading: 0,
    list: 'none',
    quote: false,
    link: false,
    image: false,
  });
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [selectedText, setSelectedText] = useState("");
  
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Configure marked options
  const markedOptions = {
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false,
  };

  // Update preview when markdown changes
  useEffect(() => {
    const html = marked(markdown, markedOptions);
    const sanitized = DOMPurify.sanitize(html);
    setPreview(sanitized);
  }, [markdown]);

  // Update markdown when content prop changes
  useEffect(() => {
    setMarkdown(content);
  }, [content]);

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);
    
    setSelection({ start, end });
    setSelectedText(text);
    
    // Detect formatting at cursor position
    detectFormattingAtPosition(start);
  }, []);

  // Detect current formatting at cursor position
  const detectFormattingAtPosition = (position: number) => {
    const text = markdown;
    const beforeCursor = text.substring(0, position);
    const afterCursor = text.substring(position);
    
    // Check for bold (**text** or __text__)
    const boldMatch = beforeCursor.match(/(\*\*|__)([^*_]+)(\*\*|__)$/);
    const boldAfter = afterCursor.match(/^([^*_]+)(\*\*|__)/);
    const isBold = boldMatch && boldAfter;
    
    // Check for italic (*text* or _text_)
    const italicMatch = beforeCursor.match(/(\*|_)([^*_]+)(\*|_)$/);
    const italicAfter = afterCursor.match(/^([^*_]+)(\*|_)/);
    const isItalic = italicMatch && italicAfter && !isBold;
    
    // Check for code (`text`)
    const codeMatch = beforeCursor.match(/`([^`]+)`$/);
    const codeAfter = afterCursor.match(/^([^`]+)`/);
    const isCode = codeMatch && codeAfter;
    
    // Check for strikethrough (~~text~~)
    const strikeMatch = beforeCursor.match(/~~([^~]+)~~$/);
    const strikeAfter = afterCursor.match(/^([^~]+)~~/);
    const isStrikethrough = strikeMatch && strikeAfter;
    
    // Check for heading (# text)
    const headingMatch = beforeCursor.match(/^(#{1,6})\s/);
    const headingLevel = headingMatch ? headingMatch[1].length : 0;
    
    // Check for list (- text or 1. text)
    const listMatch = beforeCursor.match(/^(\s*)([-*+]|\d+\.)\s/);
    const isList = !!listMatch;
    const listType = listMatch && listMatch[2].match(/\d+/) ? 'number' : 'bullet';
    
    // Check for quote (> text)
    const quoteMatch = beforeCursor.match(/^>\s/);
    const isQuote = !!quoteMatch;
    
    setFormatting({
      bold: !!isBold,
      italic: !!isItalic,
      underline: false, // Markdown doesn't have underline
      strikethrough: !!isStrikethrough,
      code: !!isCode,
      heading: headingLevel,
      list: isList ? listType : 'none',
      quote: !!isQuote,
      link: false,
      image: false,
    });
  };

  // Apply markdown formatting
  const applyMarkdownFormat = useCallback((format: keyof MarkdownFormatting, value?: any) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let newText = text;
    let newStart = start;
    let newEnd = end;
    
    switch (format) {
      case 'bold':
        if (formatting.bold) {
          // Remove bold formatting
          newText = text.substring(0, start - 2) + selectedText + text.substring(end + 2);
          newStart = start - 2;
          newEnd = end - 2;
        } else {
          // Add bold formatting
          newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
          newStart = start + 2;
          newEnd = end + 2;
        }
        break;
        
      case 'italic':
        if (formatting.italic) {
          // Remove italic formatting
          newText = text.substring(0, start - 1) + selectedText + text.substring(end + 1);
          newStart = start - 1;
          newEnd = end - 1;
        } else {
          // Add italic formatting
          newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
          newStart = start + 1;
          newEnd = end + 1;
        }
        break;
        
      case 'code':
        if (formatting.code) {
          // Remove code formatting
          newText = text.substring(0, start - 1) + selectedText + text.substring(end + 1);
          newStart = start - 1;
          newEnd = end - 1;
        } else {
          // Add code formatting
          newText = text.substring(0, start) + `\`${selectedText}\`` + text.substring(end);
          newStart = start + 1;
          newEnd = end + 1;
        }
        break;
        
      case 'strikethrough':
        if (formatting.strikethrough) {
          // Remove strikethrough formatting
          newText = text.substring(0, start - 2) + selectedText + text.substring(end + 2);
          newStart = start - 2;
          newEnd = end - 2;
        } else {
          // Add strikethrough formatting
          newText = text.substring(0, start) + `~~${selectedText}~~` + text.substring(end);
          newStart = start + 2;
          newEnd = end + 2;
        }
        break;
        
      case 'heading':
        const headingLevel = value || 1;
        const currentLineStart = text.lastIndexOf('\n', start - 1) + 1;
        const currentLineEnd = text.indexOf('\n', start);
        const currentLine = text.substring(currentLineStart, currentLineEnd === -1 ? text.length : currentLineEnd);
        
        // Remove existing heading markers
        const cleanLine = currentLine.replace(/^#{1,6}\s*/, '');
        const newHeading = '#'.repeat(headingLevel) + ' ' + cleanLine;
        
        newText = text.substring(0, currentLineStart) + newHeading + text.substring(currentLineEnd === -1 ? text.length : currentLineEnd);
        newStart = start;
        newEnd = end;
        break;
        
      case 'list':
        const listType = value || 'bullet';
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', start);
        const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
        
        if (formatting.list !== 'none') {
          // Remove list formatting
          const cleanLine = line.replace(/^(\s*)([-*+]|\d+\.)\s/, '$1');
          newText = text.substring(0, lineStart) + cleanLine + text.substring(lineEnd === -1 ? text.length : lineEnd);
        } else {
          // Add list formatting
          const indent = line.match(/^(\s*)/)?.[1] || '';
          const marker = listType === 'number' ? '1. ' : '- ';
          const newLine = indent + marker + line.trim();
          newText = text.substring(0, lineStart) + newLine + text.substring(lineEnd === -1 ? text.length : lineEnd);
        }
        break;
        
      case 'quote':
        const quoteLineStart = text.lastIndexOf('\n', start - 1) + 1;
        const quoteLineEnd = text.indexOf('\n', start);
        const quoteLine = text.substring(quoteLineStart, quoteLineEnd === -1 ? text.length : quoteLineEnd);
        
        if (formatting.quote) {
          // Remove quote formatting
          const cleanLine = quoteLine.replace(/^>\s*/, '');
          newText = text.substring(0, quoteLineStart) + cleanLine + text.substring(quoteLineEnd === -1 ? text.length : quoteLineEnd);
        } else {
          // Add quote formatting
          const newLine = '> ' + quoteLine;
          newText = text.substring(0, quoteLineStart) + newLine + text.substring(quoteLineEnd === -1 ? text.length : quoteLineEnd);
        }
        break;
    }
    
    setMarkdown(newText);
    onContentChange(newText);
    
    // Restore selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newStart, newEnd);
        textareaRef.current.focus();
      }
    }, 0);
  }, [markdown, formatting]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdown(newMarkdown);
    onContentChange(newMarkdown);
  };

  // Handle click on preview to focus textarea
  const handlePreviewClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Expose applyMarkdownFormat to parent
  useEffect(() => {
    if (onFormatChange) {
      // This is a bit of a hack, but we need to expose the function to the parent
      (window as any).applyMarkdownFormat = applyMarkdownFormat;
    }
  }, [applyMarkdownFormat, onFormatChange]);

  return (
    <div className={`flex h-full ${className}`}>
      {/* Markdown Input */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Markdown</span>
        </div>
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={handleTextChange}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          placeholder={placeholder}
          className="flex-1 w-full p-4 border-0 resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm leading-relaxed"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
        />
      </div>

      {/* Preview */}
      <div className="flex-1 flex flex-col border-l border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
        </div>
        <div
          ref={previewRef}
          onClick={handlePreviewClick}
          className="flex-1 p-4 overflow-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:dark:text-gray-100 prose-p:text-gray-900 prose-p:dark:text-gray-100 prose-strong:text-gray-900 prose-strong:dark:text-gray-100 prose-em:text-gray-900 prose-em:dark:text-gray-100 prose-code:text-gray-900 prose-code:dark:text-gray-100 prose-pre:text-gray-900 prose-pre:dark:text-gray-100 prose-blockquote:text-gray-700 prose-blockquote:dark:text-gray-300 prose-ul:text-gray-900 prose-ul:dark:text-gray-100 prose-ol:text-gray-900 prose-ol:dark:text-gray-100"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  );
}

// Export the formatting functions for use in toolbar
export { applyMarkdownFormat };
