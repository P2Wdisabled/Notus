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
  
  const markdownConverter = useRef<MarkdownConverter | null>(null);
  const formattingHandler = useRef<FormattingHandler | null>(null);

  // Wrapper for onContentChange that also updates local markdown state for debug panel
  const handleContentChange = useCallback((newMarkdown: string) => {
    // Update local markdown state for debug panel
    setMarkdown(newMarkdown);
    // Call parent's onContentChange
    onContentChange(newMarkdown);
  }, [onContentChange]);

  // Initialize converter and handler
  useEffect(() => {
    markdownConverter.current = new MarkdownConverter();
    formattingHandler.current = new FormattingHandler(
      editorRef,
      handleContentChange,
      (html: string) => markdownConverter.current?.htmlToMarkdown(html) || ""
    );
  }, [handleContentChange]);

  // Update markdown when content prop changes (from remote updates)
  useEffect(() => {
    setMarkdown(content);
  }, [content]);

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
    isUpdatingFromMarkdown
  });

  return (
    <div className={`${className}`}>
      <WysiwygEditorStyles />
      <div className="flex relative select-none">
        {/* Editor */}
        <div className={`flex flex-col relative ${showDebug ? '' : 'w-full'}`}>
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
        <DebugPanel showDebug={showDebug} markdown={markdown} />
        
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