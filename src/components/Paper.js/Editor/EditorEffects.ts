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
  isUpdatingFromMarkdown?: React.MutableRefObject<boolean>;
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
  handleEditorChange,
  isUpdatingFromMarkdown
}: EditorEffectsProps) {
  
  // Note: Initialization is handled in the main component

  // Initialize editor content once on mount and sync external changes
  useEffect(() => {
    const root = editorRef.current;
    if (!root || !markdown || !markdownConverter.current) return;

    const currentHtml = markdownConverter.current.markdownToHtml(markdown);
    const editorHtml = root.innerHTML;

    // Only update if content is different to avoid infinite loops
    if (editorHtml === currentHtml) return;

    // Helpers to preserve caret/selection across HTML refresh
    const getSelectionOffsets = (container: HTMLElement): { start: number; end: number } | null => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      // Ensure selection belongs to this editor
      if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return null;

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let start = -1;
      let end = -1;
      let offset = 0;
      let node: Node | null = walker.nextNode();
      while (node) {
        const textLen = (node.textContent || '').length;
        if (node === range.startContainer) start = offset + range.startOffset;
        if (node === range.endContainer) end = offset + range.endOffset;
        offset += textLen;
        node = walker.nextNode();
      }
      if (start < 0 || end < 0) return null;
      return { start, end };
    };

    const setSelectionOffsets = (container: HTMLElement, selStart: number, selEnd: number) => {
      const totalLength = container.textContent ? container.textContent.length : 0;
      const clamp = (v: number) => Math.max(0, Math.min(v, totalLength));
      const targetStart = clamp(selStart);
      const targetEnd = clamp(selEnd);

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      let traversed = 0;

      const locate = (target: number): { node: Node; offset: number } => {
        let n: Node | null = node;
        let acc = traversed;
        while (n) {
          const len = (n.textContent || '').length;
          if (acc + len >= target) {
            return { node: n, offset: target - acc };
          }
          acc += len;
          n = walker.nextNode();
        }
        // fallback to end of container
        return { node: container, offset: container.childNodes.length } as any;
      };

      const startPos = locate(targetStart);
      // Reset walker to beginning to compute end separately
      const walker2 = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let acc2 = 0;
      let n2: Node | null = walker2.nextNode();
      while (n2) {
        const len = (n2.textContent || '').length;
        if (acc2 + len >= targetEnd) break;
        acc2 += len;
        n2 = walker2.nextNode();
      }
      const endPos = n2 ? { node: n2, offset: targetEnd - acc2 } : startPos;

      try {
        const sel = window.getSelection();
        if (!sel) return;
        const newRange = document.createRange();
        newRange.setStart(startPos.node, startPos.offset);
        newRange.setEnd(endPos.node, endPos.offset);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } catch {
        // ignore restoration errors
      }
    };

    // If the editor is focused, preserve selection; otherwise, simple swap
    const isFocused = document.activeElement === root || root.contains(document.activeElement as Node);
    const prevSelection = isFocused ? getSelectionOffsets(root) : null;

    // Apply new HTML
    // Mark that we're updating from markdown to avoid feedback loops
    (isUpdatingFromMarkdown as any)?.current && ((isUpdatingFromMarkdown as any).current = true);
    root.innerHTML = currentHtml;

    if (prevSelection) {
      // restore selection on next tick to ensure DOM is ready
      setTimeout(() => setSelectionOffsets(root, prevSelection.start, prevSelection.end), 0);
    }
    // Clear the flag after update
    setTimeout(() => {
      (isUpdatingFromMarkdown as any)?.current && ((isUpdatingFromMarkdown as any).current = false);
    }, 0);
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
