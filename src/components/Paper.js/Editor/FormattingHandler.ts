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
    if (!this.editorRef.current) return;
    
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
        case 'strikeThrough':
          // Use native toggle for reliable add/remove across selections
          document.execCommand('strikeThrough', false);
          restoreSelection();
          break;
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
            document.execCommand('formatBlock', false, value);
            restoreSelection();
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
        case 'justifyFull':
          document.execCommand(command, false);
          restoreSelection();
          break;
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
        case 'undo':
          document.execCommand('undo', false);
          setTimeout(() => {
            restoreSelection();
          }, 10);
          break;
        case 'redo':
          document.execCommand('redo', false);
          setTimeout(() => {
            restoreSelection();
          }, 10);
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
