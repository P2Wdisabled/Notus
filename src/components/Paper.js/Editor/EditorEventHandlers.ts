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
  setSelectedImage: React.Dispatch<React.SetStateAction<HTMLImageElement | HTMLVideoElement | null>>;
  setImageOverlayRect: React.Dispatch<React.SetStateAction<{ left: number; top: number; width: number; height: number } | null>>;
  selectedImage: HTMLImageElement | HTMLVideoElement | null;
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
    // Ne pas afficher le popup pour les fichiers joints
    const target = e.target as HTMLElement;
    if (target.closest('.wysiwyg-file-attachment')) {
      return;
    }
    
    // If there's a scheduled hide, cancel it because we're hovering a link now
    try {
      if (popupHideTimerRef.current) {
        clearTimeout(popupHideTimerRef.current as any);
        popupHideTimerRef.current = null;
      }
    } catch (_) {}
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

  // Handle editor clicks to track selected image or video
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const img = target?.closest('img');
    const video = target?.closest('video');
    
    // Permettre la sélection des vidéos (pour suppression)
    if (editorRef.current && video && editorRef.current.contains(video)) {
      if (selectedImage && selectedImage !== video) {
        selectedImage.removeAttribute('data-selected-image');
      }
      (video as HTMLVideoElement).setAttribute('data-selected-image', 'true');
      setSelectedImage(video as HTMLVideoElement);
      // Update overlay rect
      requestAnimationFrame(() => {
        if (editorRef.current) {
          const videoRect = (video as HTMLVideoElement).getBoundingClientRect();
          const contRect = editorRef.current.getBoundingClientRect();
          setImageOverlayRect({
            left: videoRect.left - contRect.left,
            top: videoRect.top - contRect.top,
            width: videoRect.width,
            height: videoRect.height,
          });
        }
      });
      return;
    }
    
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
    const video = target?.closest('video');
    
    // Ne pas permettre l'édition des vidéos (seulement les images)
    if (video) {
      return;
    }
    
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
    // Empêcher le paste dans les fichiers joints
    const target = e.target as HTMLElement;
    if (target.closest('.wysiwyg-file-attachment')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
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
            // Si on est dans un fichier joint, sortir avant de coller
            const fileContainer = el.closest('.wysiwyg-file-attachment');
            if (fileContainer && fileContainer.parentNode) {
              const newRange = document.createRange();
              newRange.setStartAfter(fileContainer);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            } else {
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
    // Handle Backspace to remove a zero-width-space paragraph in one stroke
    else if (e.key === 'Backspace' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      try {
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 1) {
          const range = sel.getRangeAt(0);
          
          // Gérer la suppression des images ou vidéos sélectionnées
          const selectedMedia = editorRef.current?.querySelector('[data-selected-image="true"]') as HTMLElement;
          if (selectedMedia && (selectedMedia.tagName === 'IMG' || selectedMedia.tagName === 'VIDEO')) {
            e.preventDefault();
            const brAfter = selectedMedia.nextSibling;
            selectedMedia.remove();
            // Si un <br> suit le média, le supprimer aussi
            if (brAfter && brAfter.nodeName === 'BR') {
              brAfter.remove();
            }
            // Réinitialiser la sélection
            setSelectedImage(null);
            setImageOverlayRect(null);
            // Synchroniser le markdown
            setTimeout(() => {
              try { (handleEditorChange as any)(); } catch (_e) {}
            }, 0);
            return;
          }
          
          // Gérer la suppression des fichiers joints sélectionnés
          const selectedFile = editorRef.current?.querySelector('.wysiwyg-file-attachment[data-selected-file="true"]') as HTMLElement;
          if (selectedFile) {
            e.preventDefault();
            selectedFile.remove();
            // Synchroniser le markdown
            setTimeout(() => {
              try { (handleEditorChange as any)(); } catch (_e) {}
            }, 0);
            return;
          }
          
          // Gérer la suppression des fichiers joints (sélection par range)
          if (!range.collapsed) {
            const ancestorNode = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
              ? (range.commonAncestorContainer as Element)
              : range.commonAncestorContainer.parentElement;
            const fileContainer = ancestorNode instanceof Element
              ? (ancestorNode.closest('.wysiwyg-file-attachment') as HTMLElement | null)
              : null;
            if (fileContainer) {
              e.preventDefault();
              fileContainer.remove();
              // Synchroniser le markdown
              setTimeout(() => {
                try { (handleEditorChange as any)(); } catch (_e) {}
              }, 0);
              return;
            }
          }
          
          if (range.collapsed) {
            let node: Node | null = range.startContainer;
            if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
            const el = node as HTMLElement | null;
            const para = el?.closest ? (el.closest('p') || el.closest('div')) as HTMLElement | null : null;
            if (para) {
              const txt = para.textContent || '';
              // If paragraph contains only the zero-width-space, remove paragraph
              if (txt === '\u200B' || txt === '\u200B\n' || txt.trim() === '\u200B') {
                e.preventDefault();
                const prev = para.previousElementSibling as HTMLElement | null;
                if (prev) {
                  // remove the empty paragraph and put caret at end of previous block
                  para.remove();
                  const sel2 = window.getSelection();
                  const rng = document.createRange();
                  // find last text node inside prev
                  const walker = document.createTreeWalker(prev, NodeFilter.SHOW_TEXT);
                  let last: Node | null = null;
                  let n = walker.nextNode();
                  while (n) { last = n; n = walker.nextNode(); }
                  if (last) {
                    rng.setStart(last, (last.textContent || '').length);
                    rng.collapse(true);
                    sel2?.removeAllRanges();
                    sel2?.addRange(rng);
                  } else {
                    // fallback: place caret after prev
                    rng.setStartAfter(prev);
                    rng.collapse(true);
                    sel2?.removeAllRanges();
                    sel2?.addRange(rng);
                  }
                } else {
                  // no previous block: clear paragraph content and place caret at start
                  para.textContent = '';
                  const sel2 = window.getSelection();
                  const rng = document.createRange();
                  rng.selectNodeContents(para);
                  rng.collapse(true);
                  sel2?.removeAllRanges();
                  sel2?.addRange(rng);
                }
                try {
                  if (editorRef.current && markdownConverter.current) {
                    const updatedHtml = editorRef.current.innerHTML;
                    try {
                      const updatedMd = markdownConverter.current.htmlToMarkdown(updatedHtml);
                      onContentChange(updatedMd);
                    } catch (_err) {
                      // fallback to generic change handler if conversion fails
                      try { (handleEditorChange as any)(); } catch (_e) {}
                    }
                  } else {
                    try { (handleEditorChange as any)(); } catch (_e) {}
                  }
                } catch (_e) {}
              }
            }
          }
        }
      } catch (_e) {
        // ignore
      }
    }
    // Handle Enter to preserve empty paragraph lines across sync
    else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Allow default behavior (creates paragraph), then ensure the new paragraph
      // contains a zero-width space if it's empty so it survives HTML/MD roundtrips.
      setTimeout(() => {
        try {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          const range = sel.getRangeAt(0);
          let node: Node | null = range.startContainer;
          if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
          const el = node as HTMLElement | null;
          const paragraph = el?.closest ? (el.closest('p') || el.closest('div')) as HTMLElement | null : null;
          if (paragraph) {
            const txt = paragraph.textContent || '';
            // If paragraph contains only whitespace or is effectively empty, insert ZWSP
            if (txt.trim() === '') {
              const zw = document.createTextNode('\u200B');
              paragraph.insertBefore(zw, paragraph.firstChild || null);
              const newRange = document.createRange();
              newRange.setStart(zw, 1);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
              // Notify change so collaboration sends the updated markdown
              try { (handleEditorChange as any)(); } catch(_e) {}
            }
          }
        } catch (_e) {}
      }, 0);
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
    // Handle Delete key - permettre suppression images, vidéos et fichiers joints
    else if (e.key === 'Delete' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      try {
        // Gérer la suppression des images ou vidéos sélectionnées
        const selectedMedia = editorRef.current?.querySelector('[data-selected-image="true"]') as HTMLElement;
        if (selectedMedia && (selectedMedia.tagName === 'IMG' || selectedMedia.tagName === 'VIDEO')) {
          e.preventDefault();
          const brAfter = selectedMedia.nextSibling;
          selectedMedia.remove();
          // Si un <br> suit le média, le supprimer aussi
          if (brAfter && brAfter.nodeName === 'BR') {
            brAfter.remove();
          }
          // Réinitialiser la sélection
          setSelectedImage(null);
          setImageOverlayRect(null);
          // Synchroniser le markdown
          setTimeout(() => {
            try { (handleEditorChange as any)(); } catch (_e) {}
          }, 0);
          return;
        }
        
        // Gérer la suppression des fichiers joints sélectionnés
        const selectedFile = editorRef.current?.querySelector('.wysiwyg-file-attachment[data-selected-file="true"]') as HTMLElement;
        if (selectedFile) {
          e.preventDefault();
          selectedFile.remove();
          // Synchroniser le markdown
          setTimeout(() => {
            try { (handleEditorChange as any)(); } catch (_e) {}
          }, 0);
          return;
        }
        
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 1) {
          const range = sel.getRangeAt(0);
          if (!range.collapsed) {
            // Gérer la suppression des fichiers joints (sélection par range)
            const ancestorNode = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
              ? (range.commonAncestorContainer as Element)
              : range.commonAncestorContainer.parentElement;
            const fileContainer = ancestorNode instanceof Element
              ? (ancestorNode.closest('.wysiwyg-file-attachment') as HTMLElement | null)
              : null;
            if (fileContainer) {
              e.preventDefault();
              fileContainer.remove();
              // Synchroniser le markdown
              setTimeout(() => {
                try { (handleEditorChange as any)(); } catch (_e) {}
              }, 0);
              return;
            }
          }
        }
      } catch (_e) {
        // ignore
      }
    }
  }, [formattingHandler, handleEditorChange, editorRef, markdownConverter, onContentChange, setSelectedImage, setImageOverlayRect]);

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
