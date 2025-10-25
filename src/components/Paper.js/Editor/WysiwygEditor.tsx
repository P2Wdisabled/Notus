"use client";
import { useState, useEffect, useRef } from "react";
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
  
  // Sync external content changes only when not updating from user input
  useEffect(() => {
    if (content !== markdown) {
      setMarkdown(content);
    }
  }, [content]);
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

  // Initialize converter and handler
  useEffect(() => {
    markdownConverter.current = new MarkdownConverter();
    formattingHandler.current = new FormattingHandler(
      editorRef,
      onContentChange,
      (html: string) => markdownConverter.current?.htmlToMarkdown(html) || ""
    );
  }, [onContentChange]);

  // Update markdown when content prop changes
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
    onContentChange,
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
    onContentChange,
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
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Éditeur WYSIWYG</span>
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
              className={`wysiwyg-editor ${showDebug ? 'flex-1' : 'w-full'} p-4 border-0 resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 prose prose-sm max-w-none prose-h1:text-3xl prose-h1:font-bold prose-h1:text-gray-900 prose-h1:dark:text-gray-100 prose-h2:text-2xl prose-h2:font-bold prose-h2:text-gray-900 prose-h2:dark:text-gray-100 prose-h3:text-xl prose-h3:font-bold prose-h3:text-gray-900 prose-h3:dark:text-gray-100 prose-h4:text-lg prose-h4:font-bold prose-h4:text-gray-900 prose-h4:dark:text-gray-100 prose-h5:text-base prose-h5:font-bold prose-h5:text-gray-900 prose-h5:dark:text-gray-100 prose-h6:text-sm prose-h6:font-bold prose-h6:text-gray-900 prose-h6:dark:text-gray-100 prose-p:text-gray-900 prose-p:dark:text-gray-100 prose-strong:text-gray-900 prose-strong:dark:text-gray-100 prose-em:text-gray-900 prose-em:dark:text-gray-100 prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:underline prose-blockquote:text-gray-700 prose-blockquote:dark:text-gray-300 prose-ul:text-gray-900 prose-ul:dark:text-gray-100 prose-ol:text-gray-900 prose-ol:dark:text-gray-100`}
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