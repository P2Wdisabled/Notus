import { useEffect, useCallback } from "react";
import { MarkdownConverter } from "./MarkdownConverter";
import { FormattingHandler } from "./FormattingHandler";
import { adjustCursorPositionForTextChange } from "../../../lib/paper.js/cursorUtils";

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
  isLocalChange?: React.MutableRefObject<boolean>;
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
  isUpdatingFromMarkdown,
  isLocalChange
}: EditorEffectsProps) {
  
  // Note: Initialization is handled in the main component

  // Initialize editor content once on mount and sync external changes
  useEffect(() => {
    const root = editorRef.current;
    if (!root || !markdown || !markdownConverter.current) return;

    // Always capture selection first, before any checks
    // This is important for collaborative editing to adjust cursor position
    const getSelectionOffsets = (container: HTMLElement): { start: number; end: number } | null => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      
      // Helper to check if a node is within the container
      const isNodeInContainer = (node: Node): boolean => {
        if (node === container) return true;
        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
          return container.contains(node);
        }
        return false;
      };
      
      // Ensure selection belongs to this editor
      if (!isNodeInContainer(range.startContainer) || !isNodeInContainer(range.endContainer)) {
        return null;
      }

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let start = -1;
      let end = -1;
      let offset = 0;
      let node: Node | null = walker.nextNode();
      
      while (node) {
        const textLen = (node.textContent || '').length;
        if (node === range.startContainer) {
          start = offset + range.startOffset;
        }
        if (node === range.endContainer) {
          end = offset + range.endOffset;
        }
        // If we found both positions, we can break early
        if (start >= 0 && end >= 0) break;
        offset += textLen;
        node = walker.nextNode();
      }
      
      // If we didn't find the positions in text nodes, try a fallback
      if (start < 0 || end < 0) {
        // Fallback: calculate based on the range position relative to container
        try {
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(container);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          start = preCaretRange.toString().length;
          
          const preEndRange = range.cloneRange();
          preEndRange.selectNodeContents(container);
          preEndRange.setEnd(range.endContainer, range.endOffset);
          end = preEndRange.toString().length;
        } catch {
          return null;
        }
      }
      
      if (start < 0 || end < 0) return null;
      return { start, end };
    };

    // Helper to set selection offsets
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

    let cancelled = false;

    const runConversion = async () => {
      const currentRoot = editorRef.current;
      if (!currentRoot || cancelled) return;

      const prevSelection = getSelectionOffsets(currentRoot);
      const hasActiveSelection = prevSelection !== null;

      // Don't update HTML if this is a local change (user typing)
      // Check multiple times to handle race conditions
      if (isLocalChange?.current) {
        return;
      }

      let currentHtml: string;
      try {
        currentHtml = await markdownConverter.current!.markdownToHtml(markdown);
      } catch (error) {
        console.error('[MarkdownConverter] markdownToHtml failed', error);
        return;
      }

      if (cancelled) return;
      const activeRoot = editorRef.current;
      if (!activeRoot) return;

      const editorHtml = activeRoot.innerHTML;

      // Only update if content is different to avoid infinite loops
      // Normalize HTML for comparison (remove extra whitespace, normalize attributes)
      const normalizeHtml = (html: string) => {
        // Create a temporary div to normalize the HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.innerHTML;
      };
      
      const normalizedCurrentHtml = normalizeHtml(currentHtml);
      const normalizedEditorHtml = normalizeHtml(editorHtml);
      
      if (normalizedCurrentHtml === normalizedEditorHtml) {
        // HTML is the same, but check markdown to be sure for collaborative editing
        try {
          const currentMarkdown = markdownConverter.current!.htmlToMarkdown(editorHtml);
          // Normalize both markdowns for comparison (trim whitespace, normalize line endings)
          const normalizedCurrent = currentMarkdown.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const normalizedTarget = markdown.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          
          if (normalizedCurrent === normalizedTarget) {
            // The current HTML already represents the target markdown, no need to replace it
            return;
          }
        } catch (e) {
          // If conversion fails, proceed with update if HTML is different
          // (HTML might be different even if markdown comparison fails)
        }
      }
      
      // Final check before updating - if user started typing, don't overwrite
      if (isLocalChange?.current || cancelled) {
        return;
      }

      const oldTextContent = activeRoot.textContent || '';
      const newTextContent = (() => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentHtml;
        return tempDiv.textContent || '';
      })();

      // Check if text content actually changed - if not, don't update HTML or cursor
      const textContentChanged = oldTextContent !== newTextContent;
      
      // If text content is identical, don't update HTML to avoid cursor movement
      if (!textContentChanged && normalizedCurrentHtml === normalizedEditorHtml) {
        return;
      }

      // Apply new HTML
      // Mark that we're updating from markdown to avoid feedback loops
      (isUpdatingFromMarkdown as any)?.current && ((isUpdatingFromMarkdown as any).current = true);
      if (!editorRef.current || cancelled) return;
      editorRef.current.innerHTML = currentHtml;

      // Only restore cursor if:
      // 1. There was an active selection AND
      // 2. The text content actually changed (for collaborative editing)
      if (hasActiveSelection && prevSelection && textContentChanged) {
        // Use requestAnimationFrame for better synchronization with DOM updates
        // Then use setTimeout to ensure the DOM is fully ready
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (cancelled) return;
            try {
              // Adjust cursor positions based on text changes
              // This ensures that when another user adds/removes text, the cursor
              // position is adjusted accordingly (shifted right if text is added before,
              // shifted left if text is removed before)
              const adjustedStart = adjustCursorPositionForTextChange(oldTextContent, newTextContent, prevSelection.start);
              const adjustedEnd = adjustCursorPositionForTextChange(oldTextContent, newTextContent, prevSelection.end);
              
              // Debug logging (can be removed in production)
              console.log('🔄 Ajustement du curseur:', {
                oldTextLength: oldTextContent.length,
                newTextLength: newTextContent.length,
                oldCursor: prevSelection.start,
                adjustedCursor: adjustedStart,
                delta: adjustedStart - prevSelection.start,
                oldText: oldTextContent.substring(Math.max(0, prevSelection.start - 10), prevSelection.start + 10),
                newText: newTextContent.substring(Math.max(0, adjustedStart - 10), adjustedStart + 10)
              });
              
              setSelectionOffsets(editorRef.current!, adjustedStart, adjustedEnd);
              // Ensure the editor maintains focus if it had it before
              const currentNode = editorRef.current;
              if (!currentNode) return;
              const isFocused = document.activeElement === currentNode || currentNode.contains(document.activeElement as Node);
              if (!isFocused) {
                // Try to restore focus if the selection was active (user was typing)
                // This helps maintain the cursor position during collaborative editing
                currentNode.focus();
              }
            } catch (e) {
              // If restoration fails, try a simpler approach: place cursor at the end
              try {
                const sel = window.getSelection();
                const currentNode = editorRef.current;
                if (sel && currentNode) {
                  const range = document.createRange();
                  range.selectNodeContents(currentNode);
                  range.collapse(false); // Collapse to end
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              } catch {
                // Ignore errors
              }
            }
          }, 10); // Small delay to ensure DOM is ready
        });
      }
      // Clear the flag after update
      setTimeout(() => {
        (isUpdatingFromMarkdown as any)?.current && ((isUpdatingFromMarkdown as any).current = false);
      }, 0);
    };

    runConversion();

    return () => {
      cancelled = true;
    };
  }, [markdown, editorRef, markdownConverter, isUpdatingFromMarkdown, isLocalChange]);

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
        console.log('applyWysiwygFormatting called with command:', command, 'value:', value);
        formattingHandler.current?.applyFormatting(command, value);
      };
      console.log('applyWysiwygFormatting exposed on window');
    } else {
      console.log('formattingHandler.current is null, cannot expose applyWysiwygFormatting');
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
    const timeoutRef = debounceTimeout.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, [debounceTimeout]);
}
