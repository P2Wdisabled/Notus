import { useEffect, useCallback } from "react";
import { MarkdownConverter } from "./MarkdownConverter";
import { FormattingHandler } from "./FormattingHandler";

export interface EditorEffectsProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  markdown: string;
  markdownConverter: React.MutableRefObject<any>;
  onContentChange: (content: string) => void;
  selectedImage: HTMLImageElement | null;
  setImageOverlayRect: React.Dispatch<React.SetStateAction<{ left: number; top: number; width: number; height: number } | null>>;
  formattingHandler: React.MutableRefObject<any>;
  debounceTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  handleEditorChange: () => void;
}

export function useEditorEffects({
  editorRef,
  markdown,
  markdownConverter,
  onContentChange,
  selectedImage,
  setImageOverlayRect,
  formattingHandler,
  debounceTimeout,
  handleEditorChange
}: EditorEffectsProps) {
  
  // Note: Initialization is handled in the main component

  // Initialize editor content once on mount
  useEffect(() => {
    if (editorRef.current && markdown && !editorRef.current.innerHTML && markdownConverter.current) {
      const initialHtml = markdownConverter.current.markdownToHtml(markdown);
      editorRef.current.innerHTML = initialHtml;
    }
  }, [markdown, editorRef, markdownConverter]);

  // Keep overlay in sync on scroll/resize/content changes
  useEffect(() => {
    const updateOverlay = () => {
      if (!selectedImage || !editorRef.current) return;
      const imgRect = selectedImage.getBoundingClientRect();
      const contRect = editorRef.current.getBoundingClientRect();
      setImageOverlayRect({
        left: imgRect.left - contRect.left,
        top: imgRect.top - contRect.top,
        width: imgRect.width,
        height: imgRect.height,
      });
    };
    updateOverlay();
    window.addEventListener('scroll', updateOverlay, true);
    window.addEventListener('resize', updateOverlay);
    const interval = setInterval(updateOverlay, 250);
    return () => {
      window.removeEventListener('scroll', updateOverlay, true);
      window.removeEventListener('resize', updateOverlay);
      clearInterval(interval);
    };
  }, [selectedImage, editorRef, setImageOverlayRect]);

  // Expose functions to parent
  useEffect(() => {
    if (formattingHandler.current) {
      (window as any).applyWysiwygFormatting = (command: string, value?: string) => {
        formattingHandler.current?.applyFormatting(command, value);
      };
    }
  }, [formattingHandler]);

  // Helpers to edit currently selected image
  const applyImageEditInternal = useCallback((payload: { src?: string; widthPercent?: number; widthPx?: number }) => {
    if (!editorRef.current || !selectedImage) return false;
    const img = selectedImage;
    if (payload.src) {
      try {
        img.src = payload.src;
      } catch (_e) {
        // ignore
      }
    }
    if (typeof payload.widthPercent === 'number' && !Number.isNaN(payload.widthPercent)) {
      img.style.width = `${Math.max(1, Math.min(100, payload.widthPercent))}%`;
      img.style.maxWidth = '';
      img.style.height = 'auto';
    } else if (typeof payload.widthPx === 'number' && !Number.isNaN(payload.widthPx)) {
      img.style.width = `${Math.max(1, payload.widthPx)}px`;
      img.style.maxWidth = '';
      img.style.height = 'auto';
    }
    // sync markdown
    setTimeout(() => {
      handleEditorChange();
    }, 0);
    return true;
  }, [handleEditorChange, selectedImage, editorRef]);

  // Expose image helpers to toolbar
  useEffect(() => {
    (window as any).getCurrentImageForEditing = () => {
      const img = selectedImage;
      if (!img) return null;
      return {
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        styleWidth: img.style.width || '',
        styleHeight: img.style.height || ''
      };
    };
    (window as any).applyImageEdit = (payload: { src?: string; widthPercent?: number; widthPx?: number }) => {
      return applyImageEditInternal(payload);
    };
  }, [applyImageEditInternal, selectedImage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [debounceTimeout]);
}
