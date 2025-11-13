"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { MarkdownConverter } from "./MarkdownConverter";
import { FormattingHandler } from "./FormattingHandler";
import LinkPopup from "./LinkPopup";
import ImageOverlay from "./ImageOverlay";
import DebugPanel from "./DebugPanel";
import WysiwygEditorStyles from "./WysiwygEditorStyles";
import { useEditorEventHandlers } from "./EditorEventHandlers";
import { useEditorEffects } from "./EditorEffects";
import { useUndoRedoHistory } from "./useUndoRedoHistory";

interface WysiwygEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  showDebug?: boolean;
  readOnly?: boolean;
}

export default function WysiwygEditor({
  content,
  onContentChange,
  placeholder = "Commencez à écrire votre document...",
  className = "",
  showDebug = false,
  readOnly = false,
}: WysiwygEditorProps) {
  const [markdown, setMarkdown] = useState(content);
  
  const [linkPopup, setLinkPopup] = useState<{ visible: boolean; x: number; y: number; url: string }>({
    visible: false,
    x: 0,
    y: 0,
    url: ''
  });
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageOverlayRect, setImageOverlayRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isUpdatingFromMarkdown = useRef(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedMarkdownRef = useRef<string>(content);
  const isLocalChangeRef = useRef<boolean>(false);
  
  const markdownConverter = useRef<MarkdownConverter | null>(null);
  const formattingHandler = useRef<FormattingHandler | null>(null);

  // Undo/Redo history
  const undoRedoHistory = useUndoRedoHistory(50);

  // Initialize history with initial content
  useEffect(() => {
    undoRedoHistory.initialize(content);
    lastSavedMarkdownRef.current = content;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Wrapper for onContentChange that also updates local markdown state for debug panel
  const handleContentChange = useCallback((newMarkdown: string, skipHistory: boolean = false) => {
    // Mark as local change to prevent EditorEffects from replacing HTML
    isLocalChangeRef.current = true;
    
    // Update local markdown state for debug panel
    setMarkdown(newMarkdown);
    
    // Save to history if content actually changed and we're not undoing/redoing
    if (!skipHistory && newMarkdown !== lastSavedMarkdownRef.current) {
      undoRedoHistory.saveState(newMarkdown);
      lastSavedMarkdownRef.current = newMarkdown;
    }
    
    // Call parent's onContentChange
    onContentChange(newMarkdown);
    
    // Reset flag after a longer delay to prevent race conditions with remote updates
    // This ensures that local typing is not overwritten by incoming updates
    setTimeout(() => {
      isLocalChangeRef.current = false;
    }, 300);
  }, [onContentChange, undoRedoHistory]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const previousMarkdown = undoRedoHistory.undo();
    if (previousMarkdown !== null && editorRef.current && markdownConverter.current) {
      isUpdatingFromMarkdown.current = true;
      const html = markdownConverter.current.markdownToHtml(previousMarkdown);
      editorRef.current.innerHTML = html;
      setMarkdown(previousMarkdown);
      lastSavedMarkdownRef.current = previousMarkdown;
      handleContentChange(previousMarkdown, true);
      
      // Restore cursor position
      setTimeout(() => {
        isUpdatingFromMarkdown.current = false;
        // Place cursor at end
        const sel = window.getSelection();
        if (sel && editorRef.current) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 0);
    }
  }, [undoRedoHistory, handleContentChange]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const nextMarkdown = undoRedoHistory.redo();
    if (nextMarkdown !== null && editorRef.current && markdownConverter.current) {
      isUpdatingFromMarkdown.current = true;
      const html = markdownConverter.current.markdownToHtml(nextMarkdown);
      editorRef.current.innerHTML = html;
      setMarkdown(nextMarkdown);
      lastSavedMarkdownRef.current = nextMarkdown;
      handleContentChange(nextMarkdown, true);
      
      // Restore cursor position
      setTimeout(() => {
        isUpdatingFromMarkdown.current = false;
        // Place cursor at end
        const sel = window.getSelection();
        if (sel && editorRef.current) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 0);
    }
  }, [undoRedoHistory, handleContentChange]);

  // Expose undo/redo functions globally
  useEffect(() => {
    (window as any).handleWysiwygUndo = handleUndo;
    (window as any).handleWysiwygRedo = handleRedo;
    (window as any).canWysiwygUndo = () => undoRedoHistory.canUndo();
    (window as any).canWysiwygRedo = () => undoRedoHistory.canRedo();
    
    return () => {
      delete (window as any).handleWysiwygUndo;
      delete (window as any).handleWysiwygRedo;
      delete (window as any).canWysiwygUndo;
      delete (window as any).canWysiwygRedo;
    };
  }, [handleUndo, handleRedo, undoRedoHistory]);

  // Initialize converter and handler
  useEffect(() => {
    markdownConverter.current = new MarkdownConverter();
    formattingHandler.current = new FormattingHandler(
      editorRef,
      (md: string) => handleContentChange(md, false),
      (html: string) => markdownConverter.current?.htmlToMarkdown(html) || ""
    );
  }, [handleContentChange]);

  // Update markdown when content prop changes (from remote updates)
  // Don't save remote updates to history
  useEffect(() => {
    // Don't update if this is a local change (user is typing)
    if (isLocalChangeRef.current) {
      return;
    }
    
    if (content !== markdown && content !== lastSavedMarkdownRef.current) {
      setMarkdown(content);
      // Update history to reflect remote change, but don't add it as a new state
      // This keeps the history in sync with the actual content
      lastSavedMarkdownRef.current = content;
    }
  }, [content, markdown]);

  // Use custom hooks for event handlers and effects
  const eventHandlers = useEditorEventHandlers({
    editorRef,
    markdownConverter,
    isUpdatingFromMarkdown,
    debounceTimeout,
    markdown,
    onContentChange: handleContentChange,
    setLinkPopup,
    setSelectedImage,
    setImageOverlayRect,
    selectedImage,
    formattingHandler,
    handleEditorChange: () => {}
  });

  useEditorEffects({
    editorRef,
    markdown,
    markdownConverter,
    onContentChange: handleContentChange,
    selectedImage,
    setImageOverlayRect,
    formattingHandler,
    debounceTimeout,
    handleEditorChange: eventHandlers.handleEditorChange,
    isUpdatingFromMarkdown,
    isLocalChange: isLocalChangeRef
  });

  return (
    <div className={`${className}`}>
      <WysiwygEditorStyles />
      <div className="flex relative select-none">
        {/* Editor */}
        <div className={`flex flex-col relative w-full`}>
          {showDebug && (
            <div className="bg-muted px-3 py-2 border-b border-border">
              <span className="text-sm font-medium text-foreground">Éditeur WYSIWYG</span>
            </div>
          )}
          <div className="flex-1 relative">
            <div
              ref={editorRef}
              contentEditable={!readOnly}
              onInput={readOnly ? undefined : eventHandlers.handleEditorChange}
              onPaste={readOnly ? undefined : eventHandlers.handlePaste}
              onKeyDown={readOnly ? undefined : eventHandlers.handleKeyDown}
              onMouseOver={eventHandlers.handleLinkHover}
              onMouseOut={eventHandlers.handleLinkLeave}
              onDoubleClick={readOnly ? undefined : eventHandlers.handleEditorDoubleClick}
              className={`wysiwyg-editor ${showDebug ? 'flex-1' : 'w-full'} p-4 border-0 resize-none focus:outline-none bg-card text-foreground prose prose-sm max-w-none prose-a:text-primary prose-a:underline`}
              style={{ 
                minHeight: '200px', 
                maxHeight: 'none',
                // Styles spécifiques pour les listes
                '--tw-prose-ul': 'list-style-type: disc; margin: 1rem 0; padding-left: 1.5rem;',
                '--tw-prose-ol': 'list-style-type: decimal; margin: 1rem 0; padding-left: 1.5rem;',
                '--tw-prose-li': 'margin: 0.25rem 0; display: list-item; list-style-position: outside;'
              } as React.CSSProperties}
              data-placeholder={placeholder}
              onClick={eventHandlers.handleEditorClick}
            />
            
            {/* Inline image resize handle overlay */}
            <ImageOverlay 
              imageOverlayRect={imageOverlayRect}
              selectedImage={selectedImage}
              editorRef={editorRef}
              onImageResize={(newWidthPercent) => {
                if (selectedImage) {
                  selectedImage.style.width = `${newWidthPercent}%`;
                  selectedImage.style.height = 'auto';
                  setTimeout(() => eventHandlers.handleEditorChange(), 0);
                }
              }}
            />
          </div>
        </div>

        {/* Debug Panel */}
        <DebugPanel 
          showDebug={showDebug} 
          markdown={markdown}
          editorRef={editorRef}
          markdownConverter={markdownConverter.current}
        />
        
        {/* Link Popup */}
        <LinkPopup 
          visible={linkPopup.visible}
          x={linkPopup.x}
          y={linkPopup.y}
          url={linkPopup.url}
          onClose={() => setLinkPopup(prev => ({ ...prev, visible: false }))}
        />
      </div>
    </div>
  );
}