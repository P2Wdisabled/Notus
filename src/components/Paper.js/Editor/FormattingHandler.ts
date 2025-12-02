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

  // Apply inline formatting to selection only (not entire lines)
  private applyInlineFormatting(range: Range, tagName: string, style?: { [key: string]: string }, disableToggle: boolean = false) {
    try {
      // If the range is collapsed (no selection), do nothing
      if (range.collapsed) {
        return;
      }

      // Normalize the range to ensure it doesn't break in the middle of nodes
      range = range.cloneRange();
      
      // Check if we need to toggle formatting (if already formatted, remove it)
      const startNode = range.startContainer;
      const endNode = range.endContainer;
      
      // Check if selection is entirely within a formatting tag of the same type
      let formatParent: HTMLElement | null = null;
      let node: Node | null = startNode;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      
      while (node && node !== this.editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagLower = tagName.toLowerCase();
          
          // Check tag name match
          const tagMatches = el.tagName.toLowerCase() === tagLower || 
              (tagLower === 'strong' && (el.tagName.toLowerCase() === 'b')) || 
              (tagLower === 'em' && (el.tagName.toLowerCase() === 'i'));
          
          // If style is provided, also check if styles match
          let styleMatches = true;
          if (style && Object.keys(style).length > 0) {
            for (const [key, value] of Object.entries(style)) {
              // Convert camelCase to property name (e.g., fontSize -> fontSize)
              // style object properties are in camelCase
              const styleValue = (el.style as any)[key];
              if (styleValue !== value) {
                styleMatches = false;
                break;
              }
            }
          }
          
          if (tagMatches && styleMatches) {
            formatParent = el;
            break;
          }
        }
        node = node.parentElement;
      }

      // If selection is entirely within the formatting tag with same style, remove it (toggle behavior)
      // Skip toggle if disableToggle is true (e.g., for fontSize where we always apply the new size)
      if (formatParent && !disableToggle) {
        const parentRange = document.createRange();
        parentRange.selectNodeContents(formatParent);
        if (range.compareBoundaryPoints(Range.START_TO_START, parentRange) >= 0 &&
            range.compareBoundaryPoints(Range.END_TO_END, parentRange) <= 0) {
          // Selection is entirely within the tag, unwrap it
          const parent = formatParent.parentNode;
          if (parent) {
            while (formatParent.firstChild) {
              parent.insertBefore(formatParent.firstChild, formatParent);
            }
            parent.removeChild(formatParent);
            return;
          }
        }
      }

      // Use surroundContents for simple cases (single text node or within same element)
      try {
        const contents = range.extractContents();
        const formatEl = document.createElement(tagName);
        if (style) {
          Object.assign(formatEl.style, style);
        }
        formatEl.appendChild(contents);
        range.insertNode(formatEl);
      } catch (e) {
        // surroundContents failed, use a more complex approach
        // Split the range into text nodes and format each one
        const textNodes: { node: Text; start: number; end: number }[] = [];
        const walker = document.createTreeWalker(
          range.commonAncestorContainer,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node: Node) => {
              const nodeRange = document.createRange();
              nodeRange.selectNode(node);
              if (range.intersectsNode(node)) {
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_REJECT;
            }
          }
        );

        let textNode: Node | null;
        while (textNode = walker.nextNode()) {
          const nodeRange = document.createRange();
          nodeRange.selectNode(textNode);
          
          // Manually calculate intersection since Range.intersection() doesn't exist
          const rangeStart = range.startContainer === textNode ? range.startOffset : 0;
          const rangeEnd = range.endContainer === textNode ? range.endOffset : (textNode.textContent?.length || 0);
          const nodeStart = 0;
          const nodeEnd = textNode.textContent?.length || 0;
          
          // Check if ranges overlap
          const intersectionStart = Math.max(rangeStart, nodeStart);
          const intersectionEnd = Math.min(rangeEnd, nodeEnd);
          
          if (intersectionStart < intersectionEnd) {
            // Check if the text node is actually within the selection range
            const isNodeInRange = range.intersectsNode(textNode);
            if (isNodeInRange) {
              // Calculate offsets relative to the text node
              const start = range.startContainer === textNode ? range.startOffset : 0;
              const end = range.endContainer === textNode ? range.endOffset : (textNode.textContent?.length || 0);
              if (start < end) {
                textNodes.push({ node: textNode as Text, start, end });
              }
            }
          }
        }

        // Format each text node segment
        for (let i = textNodes.length - 1; i >= 0; i--) {
          const { node, start, end } = textNodes[i];
          if (start === 0 && end === node.textContent?.length) {
            // Format entire node
            const formatEl = document.createElement(tagName);
            if (style) {
              Object.assign(formatEl.style, style);
            }
            node.parentNode?.replaceChild(formatEl, node);
            formatEl.appendChild(node);
          } else {
            // Split node and format the middle part
            const middleText = node.textContent?.substring(start, end) || '';
            const afterText = node.textContent?.substring(end) || '';
            
            // Update node to contain only text before selection
            node.textContent = node.textContent?.substring(0, start) || '';
            
            // Create formatted element for selected text
            const formatEl = document.createElement(tagName);
            if (style) {
              Object.assign(formatEl.style, style);
            }
            formatEl.textContent = middleText;
            
            // Insert formatted element and remaining text
            const parent = node.parentNode;
            if (parent) {
              parent.insertBefore(formatEl, node.nextSibling);
              if (afterText) {
                const afterNode = document.createTextNode(afterText);
                parent.insertBefore(afterNode, formatEl.nextSibling);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to apply inline formatting, falling back to execCommand:', e);
      // Fallback to execCommand
      const execCommand = tagName === 'strong' || tagName === 'b' ? 'bold' : 
                         tagName === 'em' || tagName === 'i' ? 'italic' : 
                         tagName === 'u' ? 'underline' : tagName;
      document.execCommand(execCommand, false);
    }
  }

  // Clean up empty parent nodes after formatting
  private cleanupEmptyNodes(node: Node | null) {
    if (!node || node === this.editorRef.current) return;
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      // Check if element is empty or only contains whitespace
      if (!element.textContent || element.textContent.trim() === '') {
        const parent = element.parentNode;
        if (parent) {
          parent.removeChild(element);
          this.cleanupEmptyNodes(parent);
        }
      }
    }
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
        case 'bold': {
          // Use custom inline formatting to only affect selected text
          const savedRange = range.cloneRange();
          this.applyInlineFormatting(savedRange, 'strong');
          restoreSelection();
          this.syncMarkdown();
          break;
        }
        case 'italic': {
          // Use custom inline formatting to only affect selected text
          const savedRange = range.cloneRange();
          this.applyInlineFormatting(savedRange, 'em');
          restoreSelection();
          this.syncMarkdown();
          break;
        }
        case 'underline': {
          // Use custom inline formatting to only affect selected text
          const savedRange = range.cloneRange();
          this.applyInlineFormatting(savedRange, 'u');
          restoreSelection();
          this.syncMarkdown();
          break;
        }
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
              const { dataUrl, name, type } = fileData as { dataUrl?: string; name?: string; type?: string };
              if (!dataUrl || typeof dataUrl !== 'string') {
                console.error('Données de fichier invalides pour insertFile');
                break;
              }
              const safeName = name || 'Fichier';
              const safeType = typeof type === 'string' && type.length > 0 ? type : 'application/octet-stream';
              
              // If current selection is inside a link, move caret outside before inserting
              this.ensureSelectionOutsideLink(range, selection);
              
              const updatedRange = selection.getRangeAt(0);
              updatedRange.deleteContents();
              
              const isImage = safeType.startsWith('image/');
              const isVideo = safeType.startsWith('video/') || safeType.startsWith('audio/');
              const markDraggable = (element: HTMLElement) => {
                element.setAttribute('draggable', 'true');
                element.setAttribute('data-draggable-attachment', 'true');
              };
              
              if (isImage) {
                const img = document.createElement('img');
                img.alt = safeName;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                img.style.margin = '1rem 0';
                img.setAttribute('data-file-name', safeName);
                img.setAttribute('data-file-type', safeType);
                img.src = dataUrl;
                markDraggable(img);
                
                updatedRange.insertNode(img);
                
                const br = document.createElement('br');
                img.parentNode?.insertBefore(br, img.nextSibling);
                
                const afterRange = document.createRange();
                afterRange.setStartAfter(br);
                afterRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(afterRange);
              } else if (isVideo) {
                const video = document.createElement('video');
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.height = 'auto';
                video.style.display = 'block';
                video.style.margin = '1rem 0';
                video.setAttribute('data-file-name', safeName);
                video.setAttribute('data-file-type', safeType);
                video.src = dataUrl;
                markDraggable(video);
                
                updatedRange.insertNode(video);
                
                const br = document.createElement('br');
                video.parentNode?.insertBefore(br, video.nextSibling);
                
                const afterRange = document.createRange();
                afterRange.setStartAfter(br);
                afterRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(afterRange);
              } else {
                const container = document.createElement('div');
                container.className = 'wysiwyg-file-attachment';
                container.setAttribute('data-file-name', safeName);
                container.setAttribute('data-file-type', safeType);
                container.setAttribute('data-file-data', dataUrl);
                container.setAttribute('contenteditable', 'false');
                container.setAttribute('spellcheck', 'false');
                container.setAttribute('autocomplete', 'off');
                container.setAttribute('tabindex', '-1');
                container.style.margin = '1rem 0';
                container.style.padding = '0.75rem';
                container.style.border = '1px solid #e5e7eb';
                container.style.borderRadius = '0.5rem';
                container.style.backgroundColor = '#f9fafb';
                container.style.cursor = 'pointer';
                markDraggable(container);
                
                const fileLink = document.createElement('span');
                fileLink.textContent = safeName;
                fileLink.className = 'wysiwyg-file-link';
                fileLink.setAttribute('data-file-data', dataUrl);
                fileLink.setAttribute('data-file-name', safeName);
                fileLink.style.color = '#3b82f6';
                fileLink.style.textDecoration = 'underline';
                fileLink.style.cursor = 'pointer';
                fileLink.style.fontSize = '0.875rem';
                fileLink.style.fontWeight = '500';
                fileLink.setAttribute('contenteditable', 'false');
                fileLink.setAttribute('spellcheck', 'false');
                fileLink.setAttribute('autocomplete', 'off');
                fileLink.setAttribute('tabindex', '-1');
                
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
            const fontSizeValue = value.includes('px') ? value : `${value}px`;
            const isDefaultSize = fontSizeValue === '16px' || fontSizeValue === '16';
            
            // If default size (16px), remove fontSize spans instead of applying
            if (isDefaultSize) {
              // Find all span elements with fontSize in the selection and unwrap them
              const spansToUnwrap: HTMLElement[] = [];
              const walker = document.createTreeWalker(
                range.commonAncestorContainer,
                NodeFilter.SHOW_ELEMENT,
                {
                  acceptNode: (node: Node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      const el = node as HTMLElement;
                      if (el.tagName === 'SPAN' && el.style.fontSize) {
                        if (range.intersectsNode(el)) {
                          return NodeFilter.FILTER_ACCEPT;
                        }
                      }
                    }
                    return NodeFilter.FILTER_SKIP;
                  }
                }
              );
              
              let span: Node | null;
              while (span = walker.nextNode()) {
                spansToUnwrap.push(span as HTMLElement);
              }
              
              // Unwrap spans in reverse order to avoid offset issues
              for (let i = spansToUnwrap.length - 1; i >= 0; i--) {
                const span = spansToUnwrap[i];
                const parent = span.parentNode;
                if (parent) {
                  while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                  }
                  parent.removeChild(span);
                }
              }
              
              restoreSelection();
              this.syncMarkdown();
              break;
            }
            
            // For non-default sizes, use applyInlineFormatting like bold/italic
            // Disable toggle so we always apply the new size even if already applied
            const savedRange = range.cloneRange();
            this.applyInlineFormatting(savedRange, 'span', { fontSize: fontSizeValue }, true);
            restoreSelection();
          }
          break;
        }
        case 'undo':
          // Use custom undo handler if available
          if (window.handleWysiwygUndo) {
            window.handleWysiwygUndo();
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
          if (window.handleWysiwygRedo) {
            window.handleWysiwygRedo();
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
