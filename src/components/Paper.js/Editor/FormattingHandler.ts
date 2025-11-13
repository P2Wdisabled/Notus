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
          document.execCommand('insertOrderedList', false);
          restoreSelection();
          break;
        case 'insertUnorderedList':
          document.execCommand('insertUnorderedList', false);
          restoreSelection();
          break;
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
            // For lists, apply alignment directly to preserve list type
            const alignmentMap: { [key: string]: string } = {
              'justifyLeft': 'left',
              'justifyCenter': 'center',
              'justifyRight': 'right',
              'justifyFull': 'justify'
            };
            
            const alignment = alignmentMap[command] || 'left';
            listElement.style.textAlign = alignment;
            
            // Sync markdown after alignment change
            setTimeout(() => {
              this.syncMarkdown();
            }, 10);
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
