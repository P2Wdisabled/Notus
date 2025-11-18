import { useEffect, useCallback, useRef } from "react";
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

    // Capture selection BEFORE checking isLocalChange
    const prevSelection = getSelectionOffsets(root);
    const hasActiveSelection = prevSelection !== null;

    // Don't update HTML if this is a local change (user typing)
    // Check multiple times to handle race conditions
    if (isLocalChange?.current) {
      return;
    }

    const currentHtml = markdownConverter.current.markdownToHtml(markdown);
    const editorHtml = root.innerHTML;

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
        const currentMarkdown = markdownConverter.current.htmlToMarkdown(editorHtml);
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
    if (isLocalChange?.current) {
      return;
    }

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

    // prevSelection and hasActiveSelection are already captured above

    // Get the old text content from the editor (this is what the cursor position is based on)
    // We use textContent instead of markdown because cursor positions are based on text, not markdown formatting
    const oldTextContent = root.textContent || '';
    // Get the new text content from the new HTML
    const newTextContent = (() => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentHtml;
      return tempDiv.textContent || '';
    })();

    // Apply new HTML
    // Mark that we're updating from markdown to avoid feedback loops
    (isUpdatingFromMarkdown as any)?.current && ((isUpdatingFromMarkdown as any).current = true);
    root.innerHTML = currentHtml;

    if (hasActiveSelection && prevSelection) {
      // Use requestAnimationFrame for better synchronization with DOM updates
      // Then use setTimeout to ensure the DOM is fully ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            // Adjust cursor positions based on text changes
            // This ensures that when another user adds/removes text, the cursor
            // position is adjusted accordingly (shifted right if text is added before,
            // shifted left if text is removed before)
            let adjustedStart = prevSelection.start;
            let adjustedEnd = prevSelection.end;
            
            // Only adjust if text content actually changed
            if (oldTextContent !== newTextContent) {
              adjustedStart = adjustCursorPositionForTextChange(oldTextContent, newTextContent, prevSelection.start);
              adjustedEnd = adjustCursorPositionForTextChange(oldTextContent, newTextContent, prevSelection.end);
              
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
            }
            
            setSelectionOffsets(root, adjustedStart, adjustedEnd);
            // Ensure the editor maintains focus if it had it before
            const isFocused = document.activeElement === root || root.contains(document.activeElement as Node);
            if (!isFocused) {
              // Try to restore focus if the selection was active (user was typing)
              // This helps maintain the cursor position during collaborative editing
              root.focus();
            }
          } catch (e) {
            // If restoration fails, try a simpler approach: place cursor at the end
            try {
              const sel = window.getSelection();
              if (sel && root) {
                const range = document.createRange();
                range.selectNodeContents(root);
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

  // Cache pour les fichiers déjà chargés (évite les rechargements)
  const fileDataCache = useRef<Map<string, string>>(new Map());

  // Handle file download links and load files from API
  useEffect(() => {
    const handleFileClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Handle file attachment container or link (for non-image/video files)
      const fileContainer = target.closest('.wysiwyg-file-attachment') as HTMLElement;
      const fileLink = target.classList.contains('wysiwyg-file-link') ? target : fileContainer?.querySelector('.wysiwyg-file-link');
      
      if (fileContainer || fileLink) {
        e.preventDefault();
        e.stopPropagation();
        
        // Si on clique sur le container ou le lien, sélectionner le fichier pour suppression
        if (fileContainer) {
          // Désélectionner les autres fichiers
          const allFiles = editorRef.current?.querySelectorAll('.wysiwyg-file-attachment[data-selected-file="true"]');
          allFiles?.forEach((file) => {
            file.removeAttribute('data-selected-file');
          });
          
          // Sélectionner ce fichier
          fileContainer.setAttribute('data-selected-file', 'true');
          
          // Si on clique sur le lien, télécharger le fichier
          if (target.classList.contains('wysiwyg-file-link')) {
            // Continuer avec le téléchargement
          } else {
            // Si on clique sur le container, juste sélectionner (pas de téléchargement)
            return;
          }
        }
        
        // Sinon, télécharger le fichier
        const linkElement = fileLink as HTMLElement;
        const attachmentId = linkElement?.getAttribute('data-attachment-id') || fileContainer?.getAttribute('data-attachment-id');
        const fileName = linkElement?.getAttribute('data-file-name') || fileContainer?.getAttribute('data-file-name');
        let fileData = linkElement?.getAttribute('data-file-data');
        
        if (attachmentId && fileName) {
          try {
            if (!fileData) {
              // Vérifier le cache d'abord
              if (fileDataCache.current.has(attachmentId)) {
                fileData = fileDataCache.current.get(attachmentId)!;
                if (linkElement) linkElement.setAttribute('data-file-data', fileData);
              } else {
                // Charger depuis l'API si pas encore chargé
                const response = await fetch(`/api/attachments/${attachmentId}`);
                const result = await response.json();
                if (result.success && result.file) {
                  fileData = result.file.data;
                  if (linkElement) linkElement.setAttribute('data-file-data', fileData);
                  fileDataCache.current.set(attachmentId, fileData);
                }
              }
            }
            
            if (fileData) {
              // Télécharger tous les fichiers non-image/non-vidéo
              const link = document.createElement('a');
              link.href = fileData;
              link.download = fileName;
              link.click();
            }
          } catch (err) {
            console.error('Erreur téléchargement fichier:', err);
          }
        }
      }
    };

    // Load files from API when editor content is loaded (batch mode)
    const loadFilesFromAPI = async () => {
      if (!editorRef.current) return;
      
      // Collecter tous les IDs d'attachement qui doivent être chargés
      const attachmentIdsToLoad = new Set<string>();
      const attachmentElementMap = new Map<string, { element: HTMLElement; type: 'img' | 'video' | 'link' }>();
      
      // Images
      const images = editorRef.current.querySelectorAll('img[data-attachment-id]:not([data-loaded])');
      images.forEach((img) => {
        const imgEl = img as HTMLImageElement;
        const attachmentId = imgEl.getAttribute('data-attachment-id');
        // Charger si l'ID existe et que l'image n'a pas de src valide (vide ou pas de data:)
        if (attachmentId && (!imgEl.src || imgEl.src === '' || !imgEl.src.startsWith('data:'))) {
          // Vérifier le cache d'abord
          if (fileDataCache.current.has(attachmentId)) {
            const cachedData = fileDataCache.current.get(attachmentId)!;
            imgEl.src = cachedData;
            imgEl.setAttribute('data-loaded', 'true');
            imgEl.removeAttribute('data-loading');
          } else {
            attachmentIdsToLoad.add(attachmentId);
            attachmentElementMap.set(attachmentId, { element: imgEl, type: 'img' });
          }
        }
      });
      
      // Videos
      const videos = editorRef.current.querySelectorAll('video[data-attachment-id]:not([data-loaded])');
      videos.forEach((video) => {
        const videoEl = video as HTMLVideoElement;
        const attachmentId = videoEl.getAttribute('data-attachment-id');
        // Charger si l'ID existe et que la vidéo n'a pas de src valide (vide ou pas de data:)
        if (attachmentId && (!videoEl.src || videoEl.src === '' || !videoEl.src.startsWith('data:'))) {
          // Vérifier le cache d'abord
          if (fileDataCache.current.has(attachmentId)) {
            const cachedData = fileDataCache.current.get(attachmentId)!;
            videoEl.src = cachedData;
            videoEl.setAttribute('data-loaded', 'true');
            videoEl.removeAttribute('data-loading');
          } else {
            attachmentIdsToLoad.add(attachmentId);
            attachmentElementMap.set(attachmentId, { element: videoEl, type: 'video' });
          }
        }
      });
      
      // File links
      const fileLinks = editorRef.current.querySelectorAll('a.wysiwyg-file-link[data-attachment-id]:not([data-file-data])');
      fileLinks.forEach((link) => {
        const linkEl = link as HTMLAnchorElement;
        const attachmentId = linkEl.getAttribute('data-attachment-id');
        if (attachmentId) {
          // Vérifier le cache d'abord
          if (fileDataCache.current.has(attachmentId)) {
            const cachedData = fileDataCache.current.get(attachmentId)!;
            linkEl.setAttribute('data-file-data', cachedData);
          } else {
            attachmentIdsToLoad.add(attachmentId);
            attachmentElementMap.set(attachmentId, { element: linkEl, type: 'link' });
          }
        }
      });
      
      // Si aucun fichier à charger, on sort
      if (attachmentIdsToLoad.size === 0) return;
      
      // Charger tous les fichiers en une seule requête batch
      try {
        const response = await fetch('/api/attachments/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attachmentIds: Array.from(attachmentIdsToLoad),
          }),
        });
        
        const result = await response.json();
        
        if (result.success && result.files) {
          // Créer un map pour accès rapide
          const filesMap = new Map(result.files.map((file: any) => [file.id.toString(), file]));
          
          // Appliquer les données aux éléments correspondants
          attachmentElementMap.forEach(({ element, type }, attachmentId) => {
            const file = filesMap.get(attachmentId);
            if (file && file.data) {
              // Mettre en cache
              fileDataCache.current.set(attachmentId, file.data);
              
              if (type === 'img' && element instanceof HTMLImageElement) {
                // Vérifier que le data URL est valide
                if (file.data && file.data.startsWith('data:')) {
                  element.src = file.data;
                  element.setAttribute('data-loaded', 'true');
                  element.removeAttribute('data-loading');
                } else {
                  console.error('Données de fichier invalides pour l\'image:', attachmentId, file);
                }
              } else if (type === 'video' && element instanceof HTMLVideoElement) {
                if (file.data && file.data.startsWith('data:')) {
                  element.src = file.data;
                  element.setAttribute('data-loaded', 'true');
                  element.removeAttribute('data-loading');
                } else {
                  console.error('Données de fichier invalides pour la vidéo:', attachmentId, file);
                }
              } else if (type === 'link' && (element instanceof HTMLAnchorElement || element instanceof HTMLSpanElement)) {
                element.setAttribute('data-file-data', file.data);
              }
            } else {
              console.warn('Fichier non trouvé dans la réponse batch pour l\'ID:', attachmentId);
            }
          });
        } else {
          console.error('Erreur chargement fichiers batch:', result);
        }
      } catch (err) {
        console.error('Erreur chargement fichiers batch:', err);
      }
    };

    // Empêcher complètement l'édition du nom des fichiers joints
    const preventFileEdit = (e: Event) => {
      const target = e.target as HTMLElement;
      const fileContainer = target.closest('.wysiwyg-file-attachment') as HTMLElement;
      if (fileContainer) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Restaurer immédiatement le nom du fichier
        const fileName = fileContainer.getAttribute('data-file-name');
        const fileLink = fileContainer.querySelector('.wysiwyg-file-link') as HTMLElement;
        if (fileName && fileLink) {
          fileLink.textContent = fileName;
        }
        // Empêcher le focus sur les éléments de fichier
        if (document.activeElement && fileContainer.contains(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
        return false;
      }
    };

    // Empêcher le focus sur les fichiers joints
    const preventFileFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const fileContainer = target.closest('.wysiwyg-file-attachment') as HTMLElement;
      if (fileContainer) {
        e.preventDefault();
        e.stopPropagation();
        (target as HTMLElement).blur();
        // Déplacer le curseur après le fichier
        const selection = window.getSelection();
        if (selection && fileContainer.parentNode) {
          const range = document.createRange();
          range.setStartAfter(fileContainer);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return false;
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('click', handleFileClick);
      
      // Empêcher complètement l'édition des fichiers joints
      editor.addEventListener('beforeinput', preventFileEdit, true); // capture phase
      editor.addEventListener('input', preventFileEdit, true);
      editor.addEventListener('focusin', preventFileFocus, true);
      editor.addEventListener('focus', preventFileFocus, true);
      
      // Empêcher toutes les touches dans les fichiers joints
      editor.addEventListener('keydown', (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const fileContainer = target.closest('.wysiwyg-file-attachment') as HTMLElement;
        if (fileContainer) {
          // Permettre seulement Delete/Backspace pour supprimer le fichier entier (si sélectionné)
          if (e.key === 'Delete' || e.key === 'Backspace') {
            // Vérifier si le fichier est sélectionné, sinon empêcher
            if (!fileContainer.hasAttribute('data-selected-file')) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
          } else {
            // Empêcher toute autre touche
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
        }
      }, true); // capture phase
      
      // Surveiller les changements de contenu et restaurer immédiatement le nom
      const restoreFileName = () => {
        if (!editorRef.current) return;
        const fileContainers = editorRef.current.querySelectorAll('.wysiwyg-file-attachment');
        fileContainers.forEach((container) => {
          const fileContainer = container as HTMLElement;
          const fileName = fileContainer.getAttribute('data-file-name');
          const fileLink = fileContainer.querySelector('.wysiwyg-file-link') as HTMLElement;
          if (fileName && fileLink) {
            // Forcer le contenu à être exactement le nom du fichier
            if (fileLink.textContent !== fileName) {
              fileLink.textContent = fileName;
            }
            // S'assurer que contenteditable est false
            fileLink.setAttribute('contenteditable', 'false');
            fileContainer.setAttribute('contenteditable', 'false');
          }
        });
      };
      
      // Debounce pour éviter trop d'appels batch
      let loadFilesTimeout: NodeJS.Timeout | null = null;
      
      // Load files when content changes (debounced)
      const observer = new MutationObserver((mutations) => {
        let shouldRestore = false;
        mutations.forEach((mutation) => {
          // Si le contenu d'un fichier joint change, restaurer immédiatement
          if (mutation.type === 'characterData' || mutation.type === 'childList') {
            const target = mutation.target as HTMLElement;
            if (target.closest?.('.wysiwyg-file-attachment')) {
              shouldRestore = true;
            }
            if (mutation.addedNodes) {
              Array.from(mutation.addedNodes).forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE && (node.parentElement?.closest('.wysiwyg-file-attachment'))) {
                  shouldRestore = true;
                }
              });
            }
          }
        });
        
        if (shouldRestore) {
          restoreFileName(); // Restaurer immédiatement
        }
        
        if (loadFilesTimeout) {
          clearTimeout(loadFilesTimeout);
        }
        loadFilesTimeout = setTimeout(() => {
          loadFilesFromAPI();
          restoreFileName(); // Restaurer aussi après le chargement
        }, 300); // Attendre 300ms après le dernier changement
      });
      observer.observe(editor, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['contenteditable'] });
      
      // Initial load (avec un petit délai pour s'assurer que le DOM est prêt)
      setTimeout(() => {
        loadFilesFromAPI();
        restoreFileName();
      }, 100);
      
      return () => {
        editor.removeEventListener('click', handleFileClick);
        editor.removeEventListener('beforeinput', preventFileEdit);
        editor.removeEventListener('input', preventFileEdit);
        editor.removeEventListener('focusin', preventFileFocus);
        editor.removeEventListener('focus', preventFileFocus);
        observer.disconnect();
        if (loadFilesTimeout) {
          clearTimeout(loadFilesTimeout);
        }
      };
    }
  }, [editorRef]);

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
