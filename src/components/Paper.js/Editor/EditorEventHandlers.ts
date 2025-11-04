import { useCallback, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

export interface EditorEventHandlersProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  markdownConverter: React.MutableRefObject<any>;
  isUpdatingFromMarkdown: React.MutableRefObject<boolean>;
  debounceTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  markdown: string;
  onContentChange: (content: string) => void;
  setLinkPopup: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; url: string }>>;
  setSelectedImage: React.Dispatch<React.SetStateAction<HTMLImageElement | null>>;
  setImageOverlayRect: React.Dispatch<React.SetStateAction<{ left: number; top: number; width: number; height: number } | null>>;
  selectedImage: HTMLImageElement | null;
  formattingHandler: React.MutableRefObject<any>;
  handleEditorChange: () => void;
}

export function useEditorEventHandlers({
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
  handleEditorChange
}: EditorEventHandlersProps) {
  // Timer ref used to delay hiding the link popup to allow moving cursor to the popup
  const popupHideTimerRef = useRef<number | null>(null);
  
  // Handle content change in the editor - convert to markdown
  const handleEditorChangeCallback = useCallback((e?: React.FormEvent) => {
    if (!editorRef.current || !markdownConverter.current || isUpdatingFromMarkdown.current) return;
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Convert to markdown when user stops typing (debounced)
    debounceTimeout.current = setTimeout(() => {
      // Double check that we're not in the middle of an update
      if (isUpdatingFromMarkdown.current) return;
      
      const newHtml = editorRef.current?.innerHTML;
      if (newHtml) {
        const newMarkdown = markdownConverter.current!.htmlToMarkdown(newHtml);
        
        // Only update if markdown has actually changed to avoid unnecessary re-renders
        if (markdown !== newMarkdown) {
          // Send the new markdown upward (parent will emit via socket)
          onContentChange(newMarkdown);
        }
      }
    }, 150);
  }, [onContentChange, markdown, editorRef, markdownConverter, isUpdatingFromMarkdown, debounceTimeout]);

  // Handle link hover to show popup
  const handleLinkHover = useCallback((e: React.MouseEvent) => {
    // If there's a scheduled hide, cancel it because we're hovering a link now
    try {
      if (popupHideTimerRef.current) {
        clearTimeout(popupHideTimerRef.current as any);
        popupHideTimerRef.current = null;
      }
    } catch (_) {}
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && editorRef.current) {
      const linkRect = link.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      // Calculate position relative to the editor container
      const x = linkRect.left - editorRect.left + (linkRect.width / 2);
      const y = linkRect.top - editorRect.top - 50; // Increased offset to position above the link
      
      setLinkPopup({
        visible: true,
        x: x,
        y: y,
        url: link.getAttribute('href') || ''
      });
    }
  }, [editorRef, setLinkPopup]);

  // Handle link mouse leave to hide popup
  const handleLinkLeave = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link) {
      const relatedTarget = e.relatedTarget as HTMLElement;
      const isMovingToPopup = relatedTarget?.closest('[data-link-popup]');
      const isMovingToAnotherLink = relatedTarget?.closest('a');
      
      // Delay hiding slightly to allow the pointer to enter the popup
      if (!isMovingToPopup && !isMovingToAnotherLink) {
        try {
          if (popupHideTimerRef.current) clearTimeout(popupHideTimerRef.current as any);
        } catch (_) {}
        popupHideTimerRef.current = window.setTimeout(() => {
          setLinkPopup(prev => ({ ...prev, visible: false }));
          popupHideTimerRef.current = null;
        }, 150) as unknown as number;
      }
    }
  }, [setLinkPopup]);

  // Clear any pending timer on unmount
  useEffect(() => {
    return () => {
      try {
        if (popupHideTimerRef.current) clearTimeout(popupHideTimerRef.current as any);
      } catch (_) {}
    };
  }, []);

  // Handle editor clicks to track selected image
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const img = target?.closest('img');
    if (editorRef.current && img && editorRef.current.contains(img)) {
      if (selectedImage && selectedImage !== img) {
        selectedImage.removeAttribute('data-selected-image');
      }
      (img as HTMLImageElement).setAttribute('data-selected-image', 'true');
      setSelectedImage(img as HTMLImageElement);
      // Update overlay rect
      requestAnimationFrame(() => {
        if (editorRef.current) {
          const imgRect = (img as HTMLImageElement).getBoundingClientRect();
          const contRect = editorRef.current.getBoundingClientRect();
          setImageOverlayRect({
            left: imgRect.left - contRect.left,
            top: imgRect.top - contRect.top,
            width: imgRect.width,
            height: imgRect.height,
          });
        }
      });
    } else {
      if (selectedImage) {
        selectedImage.removeAttribute('data-selected-image');
      }
      setSelectedImage(null);
      setImageOverlayRect(null);
    }
  }, [selectedImage, editorRef, setSelectedImage, setImageOverlayRect]);

  // Handle dblclick to open image crop modal
  const handleEditorDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const img = target?.closest('img');
    if (editorRef.current && img && editorRef.current.contains(img)) {
      if (selectedImage && selectedImage !== img) {
        selectedImage.removeAttribute('data-selected-image');
      }
      (img as HTMLImageElement).setAttribute('data-selected-image', 'true');
      setSelectedImage(img as HTMLImageElement);
      try {
        const open = (window as any).openImageEditModal;
        if (typeof open === 'function') open();
      } catch (_e) {
        // no-op
      }
    }
  }, [selectedImage, editorRef, setSelectedImage]);

  // Handle paste events to clean up content
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');
    
    if (pastedData) {
      try {
        // If current selection is inside a link, move caret after the link before inserting
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
          if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
          const el = node as Element | null;
          if (el) {
            const anchor = el.closest && el.closest('a');
            if (anchor && anchor.parentNode) {
              const newRange = document.createRange();
              newRange.setStartAfter(anchor);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          }
        }
      } catch (_e) {
        // ignore
      }
      // Clean the pasted content
      const cleanHtml = DOMPurify.sanitize(pastedData);
      document.execCommand('insertHTML', false, cleanHtml);
      
      setTimeout(() => {
        handleEditorChangeCallback();
      }, 0);
    }
  }, [handleEditorChangeCallback]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!formattingHandler.current) return;
    
    // Handle Ctrl+Z for undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      formattingHandler.current.applyFormatting('undo');
    }
    // Handle Ctrl+Shift+Z or Ctrl+Y for redo
    else if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
      e.preventDefault();
      formattingHandler.current.applyFormatting('redo');
    }
    // Handle Ctrl+B for bold
    else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      formattingHandler.current.applyFormatting('bold');
    }
    // Handle Ctrl+I for italic
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      formattingHandler.current.applyFormatting('italic');
    }
    // Handle Ctrl+U for underline
    else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      formattingHandler.current.applyFormatting('underline');
    }
    // Handle Ctrl+Shift+> for quote
    else if (e.ctrlKey && e.shiftKey && e.key === '.') {
      e.preventDefault();
      formattingHandler.current.applyFormatting('insertQuote');
    }
    // Handle Ctrl+Shift+- for horizontal rule
    else if (e.ctrlKey && e.shiftKey && e.key === '-') {
      e.preventDefault();
      formattingHandler.current.applyFormatting('insertHorizontalRule');
    }
  }, [formattingHandler]);

  return {
    handleEditorChange: handleEditorChangeCallback,
    handleLinkHover,
    handleLinkLeave,
    handleEditorClick,
    handleEditorDoubleClick,
    handlePaste,
    handleKeyDown
  };
}
