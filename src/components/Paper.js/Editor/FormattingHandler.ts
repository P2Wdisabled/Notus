export class FormattingHandler {
  private editorRef: React.RefObject<HTMLDivElement | null>;
  private onContentChange: (content: string) => void;
  private htmlToMarkdown: (html: string) => string;

  constructor(
    editorRef: React.RefObject<HTMLDivElement | null>,
    onContentChange: (content: string) => void,
    htmlToMarkdown: (html: string) => string
  ) {
    this.editorRef = editorRef;
    this.onContentChange = onContentChange;
    this.htmlToMarkdown = htmlToMarkdown;
  }

  // Function to save current selection
  saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    return {
      range: range.cloneRange(),
      selectedText: range.toString(),
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    };
  }

  // Apply formatting to selection
  applyFormatting(command: string, value?: string) {
    console.log('applyFormatting called with command:', command, 'value:', value);
    if (!this.editorRef.current) {
      console.log('applyFormatting - editorRef.current is null');
      return;
    }
    
    this.editorRef.current.focus();
    
    // Ensure we have a selection; if none, place caret at the end of editor
    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const sel = window.getSelection();
      if (sel) {
        const newRange = document.createRange();
        newRange.selectNodeContents(this.editorRef.current);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
        selection = sel;
      }
    }
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    // Save selection details
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;
    
    // Function to restore selection
    const restoreSelection = () => {
      try {
        // Check if the saved containers still exist in the DOM
        if (startContainer && endContainer && 
            document.contains(startContainer) && 
            document.contains(endContainer)) {
          const newRange = document.createRange();
          const startTextLength = startContainer.textContent?.length || 0;
          const endTextLength = endContainer.textContent?.length || 0;
          newRange.setStart(startContainer, Math.min(startOffset, startTextLength));
          newRange.setEnd(endContainer, Math.min(endOffset, endTextLength));
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          // If containers are no longer valid, try to find similar content
          const editor = this.editorRef.current;
          if (editor) {
                  const textNodes = [];
                  const walker = document.createTreeWalker(
                    editor,
                    NodeFilter.SHOW_TEXT,
                    null
                  );
                  let node;
                  while (node = walker.nextNode()) {
                    textNodes.push(node);
                  }
            
            if (textNodes.length > 0) {
              // Try to find a text node that contains similar content
              let targetNode = textNodes[0];
              if (selectedText && selectedText.length > 0) {
                const matchingNode = textNodes.find(n => 
                  n.textContent && n.textContent.includes(selectedText)
                );
                if (matchingNode) {
                  targetNode = matchingNode;
                }
              }
              
              const newRange = document.createRange();
              const textLength = targetNode.textContent?.length || 0;
              const startPos = Math.min(startOffset, textLength);
              const endPos = Math.min(endOffset, textLength);
              newRange.setStart(targetNode, startPos);
              newRange.setEnd(targetNode, endPos);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else {
              // No text nodes found, place cursor at the end of the editor
              const newRange = document.createRange();
              newRange.selectNodeContents(editor);
              newRange.collapse(false);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }
      } catch (e) {
        console.warn('Selection restoration failed:', e);
        // Fallback: try to select the first text node or place cursor at end
        const editor = this.editorRef.current;
        if (editor) {
          const firstTextNode = editor.querySelector('p, div, span')?.firstChild;
          if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
            const newRange = document.createRange();
            newRange.selectNodeContents(firstTextNode);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // Last resort: place cursor at the end of the editor
            const newRange = document.createRange();
            newRange.selectNodeContents(editor);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    };
    
    try {
      console.log('applyFormatting - switch on command:', command);
      switch (command) {
        case 'bold':
          document.execCommand('bold', false);
          restoreSelection();
          break;
        case 'italic':
          document.execCommand('italic', false);
          restoreSelection();
          break;
        case 'underline':
          document.execCommand('underline', false);
          restoreSelection();
          break;
        case 'strikeThrough': {
          // Save the original range for later use
          const savedRange = range.cloneRange();
          
          // Check if strikethrough is already applied
          const isStrikethrough = document.queryCommandState('strikeThrough') ||
            (() => {
              // Check if selection is inside a strikethrough tag
              let node: Node | null = range.commonAncestorContainer;
              if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
              let currentElement: HTMLElement | null = node as HTMLElement | null;
              while (currentElement && currentElement !== this.editorRef.current) {
                if (currentElement.nodeName === 'S' || 
                    currentElement.nodeName === 'DEL' || 
                    currentElement.nodeName === 'STRIKE' ||
                    (currentElement.style?.textDecoration?.includes('line-through'))) {
                  return true;
                }
                currentElement = currentElement.parentElement as HTMLElement | null;
              }
              return false;
            })();

          if (isStrikethrough) {
            // Remove strikethrough by unwrapping strikethrough tags
            try {
              // First try native command
              document.execCommand('strikeThrough', false);
              
              // Manually unwrap strikethrough tags as fallback
              setTimeout(() => {
                const editor = this.editorRef.current;
                if (!editor) return;
                
                // Get all strikethrough elements that intersect with the saved range
                const nodesToUnwrap: HTMLElement[] = [];
                
                // Find all strikethrough tags
                const strikeTags = editor.querySelectorAll('s, del, strike');
                strikeTags.forEach((el: Element) => {
                  const htmlEl = el as HTMLElement;
                  try {
                    if (savedRange.intersectsNode(htmlEl)) {
                      nodesToUnwrap.push(htmlEl);
                    }
                  } catch (e) {
                    // If range is invalid, check if element is in selection area
                    const rect = htmlEl.getBoundingClientRect();
                    const editorRect = editor.getBoundingClientRect();
                    if (rect.top < editorRect.bottom && rect.bottom > editorRect.top) {
                      nodesToUnwrap.push(htmlEl);
                    }
                  }
                });

                // Also check for inline style strikethrough
                const allElements = editor.querySelectorAll('*');
                allElements.forEach((el: Element) => {
                  const htmlEl = el as HTMLElement;
                  if (htmlEl.style?.textDecoration?.includes('line-through')) {
                    try {
                      if (savedRange.intersectsNode(htmlEl)) {
                        htmlEl.style.textDecoration = htmlEl.style.textDecoration.replace(/line-through/g, '').trim();
                        if (!htmlEl.style.textDecoration) {
                          htmlEl.removeAttribute('style');
                        }
                      }
                    } catch (e) {
                      // If range check fails, still try to remove if it's in the general area
                      const rect = htmlEl.getBoundingClientRect();
                      const editorRect = editor.getBoundingClientRect();
                      if (rect.top < editorRect.bottom && rect.bottom > editorRect.top) {
                        htmlEl.style.textDecoration = htmlEl.style.textDecoration.replace(/line-through/g, '').trim();
                        if (!htmlEl.style.textDecoration) {
                          htmlEl.removeAttribute('style');
                        }
                      }
                    }
                  }
                });

                // Unwrap all strikethrough tags
                nodesToUnwrap.forEach(strikeEl => {
                  const parent = strikeEl.parentNode;
                  if (parent) {
                    while (strikeEl.firstChild) {
                      parent.insertBefore(strikeEl.firstChild, strikeEl);
                    }
                    parent.removeChild(strikeEl);
                  }
                });

                restoreSelection();
                this.syncMarkdown();
              }, 10);
            } catch (e) {
              // Fallback to native command
              document.execCommand('strikeThrough', false);
            }
          } else {
            // Apply strikethrough
            document.execCommand('strikeThrough', false);
          }
          restoreSelection();
          break;
        }
        case 'insertOrderedList':
        case 'insertUnorderedList': {
          const listTag = command === 'insertOrderedList' ? 'ol' : 'ul';
          
          // Find all block elements or list items that intersect with the selection
          const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'];
          const elementsToConvert: HTMLElement[] = [];
          
          const startContainer = range.startContainer;
          const endContainer = range.endContainer;
          const commonAncestor = range.commonAncestorContainer;
          
          if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
            // Use TreeWalker to get all block elements and list items in document order
            const walker = document.createTreeWalker(
              commonAncestor,
              NodeFilter.SHOW_ELEMENT,
              {
                acceptNode: (node) => {
                  const tagName = (node as Element).tagName.toLowerCase();
                  return blockTags.includes(tagName) 
                    ? NodeFilter.FILTER_ACCEPT 
                    : NodeFilter.FILTER_SKIP;
                }
              }
            );
            
            let node: Node | null;
            while (node = walker.nextNode()) {
              const el = node as HTMLElement;
              
              // Check if this element intersects with the selection
              try {
                const elRange = document.createRange();
                elRange.selectNodeContents(el);
                
                const intersects = range.compareBoundaryPoints(Range.START_TO_END, elRange) < 0 &&
                                  range.compareBoundaryPoints(Range.END_TO_START, elRange) > 0;
                
                if (intersects) {
                  elementsToConvert.push(el);
                } else {
                  // Also check if selection boundaries are within this element
                  if (el.contains(startContainer) || el.contains(endContainer)) {
                    elementsToConvert.push(el);
                  }
                }
              } catch (e) {
                // Fallback: check if element contains selection boundaries
                if (el.contains(startContainer) || el.contains(endContainer)) {
                  elementsToConvert.push(el);
                }
              }
            }
          }
          
          // If we found multiple elements, create a separate list for each one
          if (elementsToConvert.length > 0) {
            // Find the parent and insertion point
            const firstEl = elementsToConvert[0];
            let parent = firstEl.parentElement;
            let insertBefore: Node | null = firstEl;
            
            // If first element is a list item, use the list's parent and insert before the list
            if (firstEl.tagName.toLowerCase() === 'li') {
              const listParent = firstEl.closest('ul, ol');
              if (listParent) {
                parent = listParent.parentElement;
                insertBefore = listParent;
              }
            }
            
            if (parent) {
              // Store references to new lists for selection restoration
              const newLists: HTMLElement[] = [];
              
              // Create a separate list for each element
              // Process in reverse order to avoid offset issues when removing elements
              for (let i = elementsToConvert.length - 1; i >= 0; i--) {
                const el = elementsToConvert[i];
                
                // Create a new list element for this item
                const listElement = document.createElement(listTag);
                // Add a data attribute to prevent list combination
                listElement.setAttribute('data-single-item-list', 'true');
                
                // Create a list item
                let li: HTMLElement;
                
                // If it's already a list item, extract its content
                if (el.tagName.toLowerCase() === 'li') {
                  li = document.createElement('li');
                  // Move all children from existing li to new li
                  while (el.firstChild) {
                    li.appendChild(el.firstChild);
                  }
                } else {
                  // It's a block element, convert it to a list item
                  li = document.createElement('li');
                  // Move all children from block to li
                  while (el.firstChild) {
                    li.appendChild(el.firstChild);
                  }
                }
                
                // If li is empty, add a zero-width space to preserve it
                if (li.textContent?.trim() === '') {
                  li.appendChild(document.createTextNode('\u200B'));
                }
                
                // Add the li to the list
                listElement.appendChild(li);
                
                // Insert the new list right before the element (which we'll remove)
                // This ensures correct positioning
                if (el.nextSibling) {
                  parent.insertBefore(listElement, el.nextSibling);
                } else {
                  parent.appendChild(listElement);
                }
                
                newLists.unshift(listElement); // Add to beginning since we're processing in reverse
              }
              
              // Remove all converted elements
              elementsToConvert.forEach((el) => {
                if (el.parentElement) {
                  el.parentElement.removeChild(el);
                }
              });
              
              // If we removed list items, check if their parent list is now empty and remove it
              elementsToConvert.forEach((el) => {
                if (el.tagName.toLowerCase() === 'li') {
                  const oldList = el.closest('ul, ol');
                  if (oldList && oldList.children.length === 0 && oldList.parentElement) {
                    oldList.parentElement.removeChild(oldList);
                  }
                }
              });
              
              // Restore selection at the end of the last list
              if (newLists.length > 0) {
                const lastList = newLists[newLists.length - 1];
                const lastLi = lastList.lastElementChild;
                if (lastLi) {
                  const newRange = document.createRange();
                  newRange.selectNodeContents(lastLi);
                  newRange.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
              }
              
              // Sync markdown
              setTimeout(() => {
                this.syncMarkdown();
              }, 10);
            }
          } else {
            // Fallback to native command if no elements found
            document.execCommand(command, false);
            restoreSelection();
          }
          break;
        }
        case 'formatBlock':
          if (value) {
            // For multi-line selections, we need to apply formatBlock to each block element
            // Find all block elements that intersect with the selection
            const blockElements: HTMLElement[] = [];
            const startNode = range.startContainer.nodeType === Node.TEXT_NODE 
              ? range.startContainer.parentElement 
              : range.startContainer as HTMLElement;
            const endNode = range.endContainer.nodeType === Node.TEXT_NODE 
              ? range.endContainer.parentElement 
              : range.endContainer as HTMLElement;
            
            if (!startNode || !endNode) {
              document.execCommand('formatBlock', false, value);
              restoreSelection();
              break;
            }
            
            // Get the common ancestor
            const commonAncestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
              ? range.commonAncestorContainer.parentElement
              : range.commonAncestorContainer as HTMLElement;
            
            if (!commonAncestor) {
              document.execCommand('formatBlock', false, value);
              restoreSelection();
              break;
            }
            
            // Find all block elements between start and end
            const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'];
            const allElements = commonAncestor.querySelectorAll(blockTags.join(','));
            
            allElements.forEach((el) => {
              const blockEl = el as HTMLElement;
              // Check if this block element intersects with the selection
              try {
                const blockRange = document.createRange();
                blockRange.selectNodeContents(blockEl);
                
                // Check if selection intersects with this block
                const intersects = range.compareBoundaryPoints(Range.START_TO_END, blockRange) < 0 &&
                                  range.compareBoundaryPoints(Range.END_TO_START, blockRange) > 0;
                
                // Also check if selection boundaries are within this block
                const containsStart = blockEl.contains(startNode);
                const containsEnd = blockEl.contains(endNode);
                
                if (intersects || containsStart || containsEnd) {
                  if (!blockElements.includes(blockEl)) {
                    blockElements.push(blockEl);
                  }
                }
              } catch (e) {
                // If range comparison fails, check containment
                if (blockEl.contains(startNode) || blockEl.contains(endNode)) {
                  if (!blockElements.includes(blockEl)) {
                    blockElements.push(blockEl);
                  }
                }
              }
            });
            
            // Also check if startNode or endNode themselves are block elements
            if (startNode && blockTags.includes(startNode.tagName.toLowerCase()) && !blockElements.includes(startNode)) {
              blockElements.push(startNode);
            }
            if (endNode && blockTags.includes(endNode.tagName.toLowerCase()) && !blockElements.includes(endNode)) {
              blockElements.push(endNode);
            }
            
            // Apply formatBlock to each block element
            if (blockElements.length > 0) {
              blockElements.forEach((blockEl) => {
                try {
                  // Create a range for this block element
                  const blockRange = document.createRange();
                  blockRange.selectNodeContents(blockEl);
                  
                  // Set selection to this block
                  const sel = window.getSelection();
                  if (sel) {
                    sel.removeAllRanges();
                    sel.addRange(blockRange);
                    // Apply formatBlock
                    document.execCommand('formatBlock', false, value);
                  }
                } catch (e) {
                  // If execCommand fails, manually wrap content
                  try {
                    const newEl = document.createElement(value);
                    // Copy styles if needed
                    if (blockEl.style.cssText) {
                      newEl.style.cssText = blockEl.style.cssText;
                    }
                    // Move all children
                    while (blockEl.firstChild) {
                      newEl.appendChild(blockEl.firstChild);
                    }
                    // Replace old element with new one
                    blockEl.parentNode?.replaceChild(newEl, blockEl);
                  } catch (e2) {
                    // Ignore errors
                  }
                }
              });
              
              // Restore original selection
              restoreSelection();
            } else {
              // Fallback to standard behavior
              document.execCommand('formatBlock', false, value);
              restoreSelection();
            }
          }
          break;
        case 'createLink':
          // If a value was provided (e.g. from an internal popin), use it.
          if (value) {
            try {
              document.execCommand('createLink', false, value);
              restoreSelection();
            } catch (e) {
              // ignore
            }
            break;
          }

          // Fallback to native prompt if no value provided
          const urlPrompt = prompt('URL du lien:');
          if (urlPrompt) {
            document.execCommand('createLink', false, urlPrompt);
            restoreSelection();
          }
          break;
        case 'insertImage':
          if (value) {

            try {
              const img = document.createElement('img');
              img.src = value;
              img.alt = 'image';
              img.style.maxWidth = '100%';
              img.style.height = 'auto';

              // If current selection is inside a link, move caret outside before inserting
              this.ensureSelectionOutsideLink(range, selection);

              const updatedRange = selection.getRangeAt(0);
              updatedRange.deleteContents();
              updatedRange.insertNode(img);

              const br = document.createElement('br');
              img.parentNode?.insertBefore(br, img.nextSibling);

              const afterRange = document.createRange();
              afterRange.setStartAfter(br);
              afterRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(afterRange);

              setTimeout(() => {
                this.syncMarkdown();
              }, 0);
            } catch (e) {
              document.execCommand('insertImage', false, value);
            }
            restoreSelection();
          } else {
            const imageUrl = prompt('URL de l\'image:');
            if (imageUrl) {
              document.execCommand('insertImage', false, imageUrl);
              restoreSelection();
            }
          }
          break;
        case 'insertFile':
          if (value) {
            try {
              const fileData = JSON.parse(value);
              const { attachmentId, name, type } = fileData;
              
              // If current selection is inside a link, move caret outside before inserting
              this.ensureSelectionOutsideLink(range, selection);
              
              const updatedRange = selection.getRangeAt(0);
              updatedRange.deleteContents();
              
              // Déterminer le type de fichier
              const isImage = type.startsWith('image/');
              const isVideo = type.startsWith('video/') || type.startsWith('audio/');
              
              // Fonction pour charger le fichier depuis l'API
              const loadFileFromAPI = async (element: HTMLElement) => {
                try {
                  const response = await fetch(`/api/attachments/${attachmentId}`);
                  const result = await response.json();
                  if (result.success && result.file && result.file.data) {
                    // Vérifier que le data URL est valide
                    if (result.file.data.startsWith('data:')) {
                      if (element instanceof HTMLImageElement) {
                        element.src = result.file.data;
                        element.setAttribute('data-loaded', 'true');
                        element.removeAttribute('data-loading');
                      } else if (element instanceof HTMLVideoElement) {
                        element.src = result.file.data;
                        element.setAttribute('data-loaded', 'true');
                        element.removeAttribute('data-loading');
                      } else if (element instanceof HTMLAnchorElement || element instanceof HTMLSpanElement) {
                        element.setAttribute('data-file-data', result.file.data);
                      }
                    } else {
                      console.error('Data URL invalide pour le fichier:', attachmentId, result.file);
                    }
                  } else {
                    console.error('Erreur récupération fichier:', result);
                  }
                } catch (err) {
                  console.error('Erreur chargement fichier:', err);
                }
              };
              
              if (isImage) {
                // Juste l'image en preview, pas de container
                const img = document.createElement('img');
                img.alt = name;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                img.style.margin = '1rem 0';
                img.setAttribute('data-file-name', name);
                img.setAttribute('data-file-type', type);
                img.setAttribute('data-attachment-id', attachmentId.toString());
                img.setAttribute('data-loading', 'true');
                // Définir un src vide pour éviter les erreurs du navigateur
                img.src = '';
                
                updatedRange.insertNode(img);
                
                // Charger le fichier depuis l'API après insertion
                loadFileFromAPI(img);
                
                const br = document.createElement('br');
                img.parentNode?.insertBefore(br, img.nextSibling);
                
                const afterRange = document.createRange();
                afterRange.setStartAfter(br);
                afterRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(afterRange);
              } else if (isVideo) {
                // Juste la vidéo en preview, pas de container
                const video = document.createElement('video');
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                video.style.display = 'block';
                video.style.margin = '1rem 0';
                video.setAttribute('data-file-name', name);
                video.setAttribute('data-file-type', type);
                video.setAttribute('data-attachment-id', attachmentId.toString());
                video.setAttribute('data-loading', 'true');
                
                // Charger le fichier depuis l'API
                loadFileFromAPI(video);
                
                updatedRange.insertNode(video);
                
                const br = document.createElement('br');
                video.parentNode?.insertBefore(br, video.nextSibling);
                
                const afterRange = document.createRange();
                afterRange.setStartAfter(br);
                afterRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(afterRange);
              } else {
                // Block avec nom cliquable pour les autres fichiers
                const container = document.createElement('div');
                container.className = 'wysiwyg-file-attachment';
                container.setAttribute('data-file-name', name);
                container.setAttribute('data-file-type', type);
                container.setAttribute('data-attachment-id', attachmentId.toString());
                container.setAttribute('contenteditable', 'false'); // Non éditable
                container.setAttribute('spellcheck', 'false');
                container.setAttribute('autocomplete', 'off');
                container.setAttribute('tabindex', '-1'); // Empêcher le focus
                container.style.margin = '1rem 0';
                container.style.padding = '0.75rem';
                container.style.border = '1px solid #e5e7eb';
                container.style.borderRadius = '0.5rem';
                container.style.backgroundColor = '#f9fafb';
                container.style.cursor = 'pointer';
                
                const fileLink = document.createElement('span'); // Utiliser span au lieu de <a> pour éviter le popup
                fileLink.textContent = name;
                fileLink.className = 'wysiwyg-file-link';
                fileLink.setAttribute('data-attachment-id', attachmentId.toString());
                fileLink.setAttribute('data-file-name', name);
                fileLink.style.color = '#3b82f6';
                fileLink.style.textDecoration = 'underline';
                fileLink.style.cursor = 'pointer';
                fileLink.style.fontSize = '0.875rem';
                fileLink.style.fontWeight = '500';
                fileLink.setAttribute('contenteditable', 'false'); // Non éditable
                fileLink.setAttribute('spellcheck', 'false');
                fileLink.setAttribute('autocomplete', 'off');
                // Empêcher le focus
                fileLink.setAttribute('tabindex', '-1');
                
                // Charger le fichier depuis l'API
                loadFileFromAPI(fileLink);
                
                container.appendChild(fileLink);
                
                updatedRange.insertNode(container);
                
                const br = document.createElement('br');
                container.parentNode?.insertBefore(br, container.nextSibling);
                
                const afterRange = document.createRange();
                afterRange.setStartAfter(br);
                afterRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(afterRange);
              }
              
              setTimeout(() => {
                this.syncMarkdown();
              }, 0);
            } catch (e) {
              console.error('Erreur insertion fichier:', e);
            }
            restoreSelection();
          }
          break;
        case 'indent':
          document.execCommand('indent', false);
          restoreSelection();
          break;
        case 'outdent':
          document.execCommand('outdent', false);
          restoreSelection();
          break;
        case 'justifyLeft':
        case 'justifyCenter':
        case 'justifyRight':
        case 'justifyFull': {
          // Check if we're inside a list and preserve its type (ol vs ul)
          let node: Node | null = range.commonAncestorContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
          const listElement = (node as Element)?.closest('ol, ul') as HTMLElement | null;
          
          if (listElement) {
            // For lists, we need to find all list items that intersect with the selection
            const alignmentMap: { [key: string]: string } = {
              'justifyLeft': 'left',
              'justifyCenter': 'center',
              'justifyRight': 'right',
              'justifyFull': 'justify'
            };
            
            const alignment = alignmentMap[command] || 'left';
            
            // Find all list items that intersect with the selection
            const listItems: HTMLElement[] = [];
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            
            // Get all list items in the list
            const allListItems = Array.from(listElement.querySelectorAll('li'));
            
            allListItems.forEach((li) => {
              try {
                const liRange = document.createRange();
                liRange.selectNodeContents(li);
                
                const intersects = range.compareBoundaryPoints(Range.START_TO_END, liRange) < 0 &&
                                  range.compareBoundaryPoints(Range.END_TO_START, liRange) > 0;
                
                if (intersects) {
                  listItems.push(li as HTMLElement);
                } else {
                  // Also check if selection boundaries are within this list item
                  if (li.contains(startContainer) || li.contains(endContainer)) {
                    listItems.push(li as HTMLElement);
                  }
                }
              } catch (e) {
                // Fallback: check if list item contains selection boundaries
                if (li.contains(startContainer) || li.contains(endContainer)) {
                  listItems.push(li as HTMLElement);
                }
              }
            });
            
            // If we found list items, create a separate list for each one
            if (listItems.length > 0) {
              const listTag = listElement.tagName.toLowerCase();
              const parent = listElement.parentElement;
              
              if (parent) {
                // Get all list items in order
                const allListItems = Array.from(listElement.children) as HTMLElement[];
                
                // Store the original list's position BEFORE removing items
                const listNextSibling = listElement.nextSibling;
                const listPrevSibling = listElement.previousSibling;
                
                // Create a set of selected indices for quick lookup
                const selectedIndices = new Set<number>();
                listItems.forEach((li) => {
                  const idx = allListItems.indexOf(li);
                  if (idx >= 0) {
                    selectedIndices.add(idx);
                  }
                });
                
                // Create lists for ALL items (both selected and non-selected) to preserve order
                // Selected items get alignment, non-selected items don't
                const allNewLists: { list: HTMLElement; originalIndex: number }[] = [];
                
                allListItems.forEach((li, index) => {
                  const isSelected = selectedIndices.has(index);
                  
                  // Create a new list for this item
                  const newList = document.createElement(listTag);
                  
                  // Only apply alignment if this item was selected
                  if (isSelected) {
                    newList.style.textAlign = alignment;
                  }
                  
                  // Clone the list item and move it to the new list
                  const newLi = li.cloneNode(true) as HTMLElement;
                  newList.appendChild(newLi);
                  
                  allNewLists.push({ list: newList, originalIndex: index });
                });
                
                // Remove the original list
                parent.removeChild(listElement);
                
                // Insert all new lists at the original list's position, in order
                // Process in reverse order to avoid offset issues
                for (let i = allNewLists.length - 1; i >= 0; i--) {
                  const { list: newList } = allNewLists[i];
                  let insertBefore: Node | null = null;
                  
                  if (i === allNewLists.length - 1) {
                    // First list to insert (last in array): insert at the original list's position
                    if (listNextSibling) {
                      insertBefore = listNextSibling;
                    } else if (listPrevSibling) {
                      insertBefore = listPrevSibling.nextSibling;
                    }
                  } else {
                    // Insert before the previously inserted list
                    insertBefore = allNewLists[i + 1].list;
                  }
                  
                  if (insertBefore) {
                    parent.insertBefore(newList, insertBefore);
                  } else {
                    parent.appendChild(newList);
                  }
                }
                
                // Restore selection at the end of the last selected list
                // Find the last selected list
                let lastSelectedList: HTMLElement | null = null;
                for (let i = allNewLists.length - 1; i >= 0; i--) {
                  if (selectedIndices.has(allNewLists[i].originalIndex)) {
                    lastSelectedList = allNewLists[i].list;
                    break;
                  }
                }
                
                if (lastSelectedList && lastSelectedList.lastElementChild) {
                  const newRange = document.createRange();
                  newRange.selectNodeContents(lastSelectedList.lastElementChild);
                  newRange.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
                
                // Sync markdown after alignment change
                setTimeout(() => {
                  this.syncMarkdown();
                }, 10);
              }
            } else {
              // No list items found, apply alignment to the whole list
              listElement.style.textAlign = alignment;
              
              // Sync markdown after alignment change
              setTimeout(() => {
                this.syncMarkdown();
              }, 10);
            }
          } else {
            // Not in a list, use standard command
            document.execCommand(command, false);
          }
          restoreSelection();
          break;
        }
        case 'foreColor':
          if (value) {
            document.execCommand('foreColor', false, value);
            restoreSelection();
          }
          break;
        case 'backColor':
          if (value) {
            if (value === 'transparent') {
              document.execCommand('removeFormat', false);
            } else {
              document.execCommand('backColor', false, value);
            }
            restoreSelection();
          }
          break;
        case 'fontSize': {
          if (value) {
            // For fontSize, we need to apply it to all text nodes in the selection
            // because document.execCommand('fontSize') only affects start and end nodes
            
            const fontSizeValue = value.includes('px') ? value : `${value}px`;
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            const startOffset = range.startOffset;
            const endOffset = range.endOffset;
            
            // Get the common ancestor
            const commonAncestor = range.commonAncestorContainer;
            
            // Find all block elements that intersect with the selection
            const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'];
            const blockElements: HTMLElement[] = [];
            
            console.log('fontSize - startContainer:', startContainer, 'endContainer:', endContainer);
            console.log('fontSize - commonAncestor:', commonAncestor);
            
            if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
              // Find start and end blocks
              const startBlock = startContainer.nodeType === Node.TEXT_NODE 
                ? (startContainer as Text).parentElement?.closest(blockTags.join(','))
                : (startContainer as Element).closest(blockTags.join(','));
              const endBlock = endContainer.nodeType === Node.TEXT_NODE 
                ? (endContainer as Text).parentElement?.closest(blockTags.join(','))
                : (endContainer as Element).closest(blockTags.join(','));
              
              console.log('fontSize - startBlock:', startBlock, 'endBlock:', endBlock);
              
              if (startBlock && endBlock) {
                // Use TreeWalker to get all block elements in document order
                const walker = document.createTreeWalker(
                  commonAncestor,
                  NodeFilter.SHOW_ELEMENT,
                  {
                    acceptNode: (node) => {
                      const tagName = (node as Element).tagName.toLowerCase();
                      return blockTags.includes(tagName) 
                        ? NodeFilter.FILTER_ACCEPT 
                        : NodeFilter.FILTER_SKIP;
                    }
                  }
                );
                
                let foundStart = false;
                let node: Node | null;
                
                while (node = walker.nextNode()) {
                  const blockEl = node as HTMLElement;
                  
                  // If we found the start block, start collecting
                  if (blockEl === startBlock) {
                    foundStart = true;
                  }
                  
                  // Collect all blocks from start to end (inclusive)
                  if (foundStart) {
                    if (!blockElements.includes(blockEl)) {
                      blockElements.push(blockEl);
                    }
                    
                    // Stop when we reach the end block
                    if (blockEl === endBlock) {
                      break; // We're done
                    }
                  }
                }
                
                // If we didn't find blocks in order (e.g., nested structures), use range-based detection
                if (blockElements.length === 0 || (startBlock !== endBlock && blockElements.length < 2)) {
                  blockElements.length = 0; // Reset
                  
                  // Use TreeWalker again to check all blocks
                  const walker2 = document.createTreeWalker(
                    commonAncestor,
                    NodeFilter.SHOW_ELEMENT,
                    {
                      acceptNode: (node) => {
                        const tagName = (node as Element).tagName.toLowerCase();
                        return blockTags.includes(tagName) 
                          ? NodeFilter.FILTER_ACCEPT 
                          : NodeFilter.FILTER_SKIP;
                      }
                    }
                  );
                  
                  let node2: Node | null;
                  while (node2 = walker2.nextNode()) {
                    const blockEl = node2 as HTMLElement;
                    try {
                      const blockRange = document.createRange();
                      blockRange.selectNodeContents(blockEl);
                      
                      // Check if block intersects with selection
                      const intersects = range.compareBoundaryPoints(Range.START_TO_END, blockRange) < 0 &&
                                        range.compareBoundaryPoints(Range.END_TO_START, blockRange) > 0;
                      
                      if (intersects) {
                        if (!blockElements.includes(blockEl)) {
                          blockElements.push(blockEl);
                        }
                      }
                    } catch (e) {
                      // Check if selection boundaries are within this block
                      if (blockEl.contains(startContainer) || blockEl.contains(endContainer)) {
                        if (!blockElements.includes(blockEl)) {
                          blockElements.push(blockEl);
                        }
                      }
                    }
                  }
                  
                  // Always include start and end blocks
                  if (startBlock && !blockElements.includes(startBlock as HTMLElement)) {
                    blockElements.push(startBlock as HTMLElement);
                  }
                  if (endBlock && !blockElements.includes(endBlock as HTMLElement)) {
                    blockElements.push(endBlock as HTMLElement);
                  }
                }
              } else {
                // Fallback: use range-based detection with TreeWalker
                const walker = document.createTreeWalker(
                  commonAncestor,
                  NodeFilter.SHOW_ELEMENT,
                  {
                    acceptNode: (node) => {
                      const tagName = (node as Element).tagName.toLowerCase();
                      return blockTags.includes(tagName) 
                        ? NodeFilter.FILTER_ACCEPT 
                        : NodeFilter.FILTER_SKIP;
                    }
                  }
                );
                
                let node: Node | null;
                while (node = walker.nextNode()) {
                  const blockEl = node as HTMLElement;
                  try {
                    const blockRange = document.createRange();
                    blockRange.selectNodeContents(blockEl);
                    
                    const intersects = range.compareBoundaryPoints(Range.START_TO_END, blockRange) < 0 &&
                                      range.compareBoundaryPoints(Range.END_TO_START, blockRange) > 0;
                    
                    if (intersects) {
                      if (!blockElements.includes(blockEl)) {
                        blockElements.push(blockEl);
                      }
                    }
                  } catch (e) {
                    if (blockEl.contains(startContainer) || blockEl.contains(endContainer)) {
                      if (!blockElements.includes(blockEl)) {
                        blockElements.push(blockEl);
                      }
                    }
                  }
                }
              }
            }
            
            console.log('fontSize - blockElements found:', blockElements.length, blockElements);
            
            // Now apply fontSize by wrapping selected text in spans (to avoid converting blocks to headings)
            // We'll wrap text nodes in spans with fontSize instead of applying to block elements
            
            // For each block element, find all text nodes within the selection and wrap them
            blockElements.forEach((blockEl) => {
              // Check if the entire block is selected
              // If this block is between startBlock and endBlock (and not one of them), it's fully selected
              const startBlock = startContainer.nodeType === Node.TEXT_NODE 
                ? (startContainer as Text).parentElement?.closest(blockTags.join(','))
                : (startContainer as Element).closest(blockTags.join(','));
              const endBlock = endContainer.nodeType === Node.TEXT_NODE 
                ? (endContainer as Text).parentElement?.closest(blockTags.join(','))
                : (endContainer as Element).closest(blockTags.join(','));
              console.log('blocks', blockEl, startBlock, endBlock);
              
              let entireBlockSelected = false;
              
              // If this block is not the start or end block, it's likely fully selected
              if (startBlock && endBlock && blockEl !== startBlock && blockEl !== endBlock) {
                entireBlockSelected = true;
              } else {
                // For start/end blocks, check if they're fully selected
                try {
                  const blockRange = document.createRange();
                  blockRange.selectNodeContents(blockEl);
                  
                  const startBefore = range.compareBoundaryPoints(Range.START_TO_START, blockRange) <= 0;
                  const endAfter = range.compareBoundaryPoints(Range.END_TO_END, blockRange) >= 0;
                  
                  entireBlockSelected = startBefore && endAfter;
                } catch (e) {
                  // If we can't determine, assume it's fully selected if it's a middle block
                  entireBlockSelected = blockEl !== startBlock && blockEl !== endBlock;
                }
              }
              
              // Get all text nodes in this block
              const walker = document.createTreeWalker(
                blockEl,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              const textNodesToWrap: { node: Text; startOffset: number; endOffset: number }[] = [];
              
              let node: Node | null;
              while (node = walker.nextNode()) {
                const textNode = node as Text;
                
                // If entire block is selected, wrap all text nodes
                if (entireBlockSelected) {
                  textNodesToWrap.push({ node: textNode, startOffset: 0, endOffset: textNode.textContent?.length || 0 });
                  continue;
                }
                
                // Check if this text node is within the selection range
                try {
                  if (range.intersectsNode(textNode)) {
                    // Calculate which part of the text node is selected
                    const nodeRange = document.createRange();
                    nodeRange.selectNodeContents(textNode);
                    
                    let nodeStartOffset = 0;
                    let nodeEndOffset = textNode.textContent?.length || 0;
                    
                    // Check if the entire text node is selected
                    const startBefore = range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0;
                    const endAfter = range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0;
                    
                    if (startBefore && endAfter) {
                      // Entire node selected
                      textNodesToWrap.push({ node: textNode, startOffset: 0, endOffset: textNode.textContent?.length || 0 });
                    } else {
                      // Partial selection - calculate actual offsets
                      // If selection starts within this text node
                      if (startContainer === textNode) {
                        nodeStartOffset = startOffset;
                      }
                      
                      // If selection ends within this text node
                      if (endContainer === textNode) {
                        nodeEndOffset = endOffset;
                      }
                      
                      textNodesToWrap.push({ node: textNode, startOffset: nodeStartOffset, endOffset: nodeEndOffset });
                    }
                  }
                } catch (e) {
                  // Fallback: if intersectsNode fails, check using range comparison
                  try {
                    const nodeRange = document.createRange();
                    nodeRange.selectNodeContents(textNode);
                    
                    const intersects = range.compareBoundaryPoints(Range.START_TO_END, nodeRange) < 0 &&
                                      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) > 0;
                    
                    if (intersects) {
                      // For fallback, assume entire node is selected
                      textNodesToWrap.push({ node: textNode, startOffset: 0, endOffset: textNode.textContent?.length || 0 });
                    }
                  } catch (e2) {
                    // Ignore
                  }
                }
              }
              
              // Wrap text nodes in spans with fontSize
              // Process in reverse order to avoid offset issues when modifying DOM
              for (let i = textNodesToWrap.length - 1; i >= 0; i--) {
                const { node: textNode, startOffset: nodeStartOffset, endOffset: nodeEndOffset } = textNodesToWrap[i];
                const parent = textNode.parentElement;
                if (!parent || parent === this.editorRef.current) continue;
                
                // Check if parent is already a span with the same fontSize (avoid double-wrapping)
                if (parent.tagName === 'SPAN' && parent.style.fontSize === fontSizeValue) {
                  continue;
                }
                
                // Check if parent already has fontSize applied directly (skip if it's a block element)
                const isBlockElement = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI'].includes(parent.tagName);
                if (!isBlockElement && parent.style.fontSize === fontSizeValue) {
                  continue;
                }
                
                const textContent = textNode.textContent || '';
                const selectedText = textContent.substring(nodeStartOffset, nodeEndOffset);
                
                if (selectedText.length === 0) continue;
                
                // Create a span with fontSize
                const span = document.createElement('span');
                span.style.fontSize = fontSizeValue;
                span.textContent = selectedText;
                
                if (nodeStartOffset === 0 && nodeEndOffset === textContent.length) {
                  // Entire text node is selected - replace with span
                  parent.replaceChild(span, textNode);
                } else {
                  // Partial selection - split the text node
                  const beforeText = textContent.substring(0, nodeStartOffset);
                  const afterText = textContent.substring(nodeEndOffset);
                  
                  // Insert nodes in order: before, span, after
                  if (beforeText) {
                    const beforeNode = document.createTextNode(beforeText);
                    parent.insertBefore(beforeNode, textNode);
                  }
                  parent.insertBefore(span, textNode);
                  if (afterText) {
                    const afterNode = document.createTextNode(afterText);
                    parent.insertBefore(afterNode, textNode);
                  }
                  parent.removeChild(textNode);
                }
              }
            });
            
            restoreSelection();
          }
          break;
        }
        case 'undo':
          // Use custom undo handler if available
          if ((window as any).handleWysiwygUndo) {
            (window as any).handleWysiwygUndo();
          } else {
            // Fallback to native command
            document.execCommand('undo', false);
            setTimeout(() => {
              restoreSelection();
            }, 10);
          }
          break;
        case 'redo':
          // Use custom redo handler if available
          if ((window as any).handleWysiwygRedo) {
            (window as any).handleWysiwygRedo();
          } else {
            // Fallback to native command
            document.execCommand('redo', false);
            setTimeout(() => {
              restoreSelection();
            }, 10);
          }
          break;
        case 'insertQuote': {
          const currentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement
            : range.commonAncestorContainer as Element;
          const existingBlockquote = currentElement?.closest('blockquote');

          if (existingBlockquote) {
            const parent = existingBlockquote.parentNode;
            while (existingBlockquote.firstChild) {
              parent?.insertBefore(existingBlockquote.firstChild, existingBlockquote);
            }
            parent?.removeChild(existingBlockquote);
            restoreSelection();
            break;
          }

          const blockquote = document.createElement('blockquote');
          if (selectedText) {
            blockquote.textContent = selectedText;
            range.deleteContents();
            range.insertNode(blockquote);
            restoreSelection();
            break;
          }

          const p = document.createElement('p');
          const zw = document.createTextNode('\u200B');
          p.appendChild(zw);
          blockquote.appendChild(p);

          range.insertNode(blockquote);

          try {
            const sel = window.getSelection();
            if (sel) {
              const newRange = document.createRange();
              newRange.setStart(zw, 1);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          } catch (_e) {
          }

          break;
        }
        case 'insertHorizontalRule':
          const hr = document.createElement('hr');
          range.deleteContents();
          range.insertNode(hr);
          restoreSelection();
          break;
        case 'replaceSelectedImage': {
          try {
            const data = value ? JSON.parse(value) : {};
            const imgFromAttr = this.editorRef.current?.querySelector('img[data-selected-image="true"]') as HTMLImageElement | null;
            if (imgFromAttr) {
              this.setImageProperties(imgFromAttr, {
                src: typeof data.src === 'string' ? data.src : undefined,
                widthPercent: typeof data.widthPercent === 'number' ? data.widthPercent : undefined,
                widthPx: typeof data.widthPx === 'number' ? data.widthPx : undefined,
              });
              setTimeout(() => {
                this.syncMarkdown();
              }, 0);
            }
          } catch (_e) {
          }
          break;
        }
        case 'setImageWidth': {
          try {
            if (value && value.trim().startsWith('{')) {
              const data = JSON.parse(value);
              const imgFromAttr = this.editorRef.current?.querySelector('img[data-selected-image="true"]') as HTMLImageElement | null;
              if (imgFromAttr) {
                this.setImageProperties(imgFromAttr, {
                  widthPercent: typeof data.widthPercent === 'number' ? data.widthPercent : undefined,
                  widthPx: typeof data.widthPx === 'number' ? data.widthPx : undefined,
                });
              }
            } else if (value) {
              const num = Number(value);
              if (!Number.isNaN(num)) {
                const imgFromAttr = this.editorRef.current?.querySelector('img[data-selected-image="true"]') as HTMLImageElement | null;
                if (imgFromAttr) {
                  this.setImageProperties(imgFromAttr, { widthPercent: num });
                }
              }
            }
          } catch (_e) {
          }
          break;
        }
      }
      
      setTimeout(() => {
        this.syncMarkdown();
      }, 50);
    } catch (error) {
      console.error('Error applying formatting:', error);
    }
  }

  // Ensure the current selection/caret is moved outside of the nearest anchor (<a>) if any.
  // Returns a Range representing the (possibly updated) selection range.
  private ensureSelectionOutsideLink(range: Range, selection: Selection): Range {
    try {
      let node: Node | null = range.commonAncestorContainer;
      // If text node, use its parent element to search for anchors
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement as Node;
      const el = node as Element | null;
      if (el) {
        const anchor = el.closest && el.closest('a');
        if (anchor && anchor.parentNode) {
          const newRange = document.createRange();
          // Place caret immediately after the anchor to avoid inserting inside it
          newRange.setStartAfter(anchor);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          return newRange;
        }
      }
    } catch (e) {
      // ignore and return original range
    }
    return range;
  }

  private setImageProperties(img: HTMLImageElement, payload: { src?: string; widthPercent?: number; widthPx?: number }) {
    if (payload.src) {
      try { img.src = payload.src; } catch {}
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
  }

  private syncMarkdown() {
    if (this.editorRef.current) {
      const newHtml = this.editorRef.current.innerHTML;
      const newMarkdown = this.htmlToMarkdown(newHtml);
      this.onContentChange(newMarkdown);
    }
  }
}
