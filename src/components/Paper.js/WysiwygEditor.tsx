"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import TurndownService from "turndown";

interface WysiwygEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  showDebug?: boolean;
}

export default function WysiwygEditor({
  content,
  onContentChange,
  placeholder = "Commencez à écrire votre document...",
  className = "",
  showDebug = false,
}: WysiwygEditorProps) {
  const [markdown, setMarkdown] = useState(content);
  const editorRef = useRef<HTMLDivElement>(null);
  const turndownService = useRef<TurndownService | null>(null);
  const isUpdatingFromMarkdown = useRef(false);
  const lastCursorPosition = useRef<number>(0);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize turndown service
  useEffect(() => {
    turndownService.current = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
    });

    // Add custom rules for better HTML to Markdown conversion
    turndownService.current.addRule('underline', {
      filter: 'u',
      replacement: (content) => `<u>${content}</u>`
    });

    turndownService.current.addRule('strikethrough', {
      filter: ['s', 'del'],
      replacement: (content) => `~~${content}~~`
    });

    // Handle strikethrough via CSS
    turndownService.current.addRule('strikethroughCSS', {
      filter: (node) => {
        return node.nodeName === 'SPAN' && 
               node.style && 
               node.style.textDecoration?.includes('line-through');
      },
      replacement: (content) => `~~${content}~~`
    });

    turndownService.current.addRule('textAlign', {
      filter: (node) => {
        return node.nodeName === 'DIV' && node.style && node.style.textAlign;
      },
      replacement: (content, node) => {
        const align = (node as HTMLElement).style.textAlign;
        if (align === 'center') return `<div style="text-align: center">${content}</div>`;
        if (align === 'right') return `<div style="text-align: right">${content}</div>`;
        if (align === 'justify') return `<div style="text-align: justify">${content}</div>`;
        return content;
      }
    });

    // Handle inline styles
    turndownService.current.addRule('inlineStyles', {
      filter: (node) => {
        return node.nodeName === 'SPAN' && node.style && (
          node.style.textDecoration?.includes('underline') ||
          node.style.textDecoration?.includes('line-through') ||
          node.style.fontWeight === 'bold' ||
          node.style.fontStyle === 'italic' ||
          node.style.color ||
          node.style.backgroundColor
        );
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        let result = content;
        let styles: string[] = [];
        
        if (element.style.fontWeight === 'bold') {
          result = `**${result}**`;
        }
        if (element.style.fontStyle === 'italic') {
          result = `*${result}*`;
        }
        if (element.style.textDecoration?.includes('underline')) {
          result = `<u>${result}</u>`;
        }
        if (element.style.textDecoration?.includes('line-through')) {
          result = `~~${result}~~`;
        }
        if (element.style.color && element.style.color !== 'rgb(0, 0, 0)') {
          // Convert rgb to hex
          let hexColor = element.style.color;
          if (element.style.color.startsWith('rgb')) {
            const rgb = element.style.color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
          }
          styles.push(`color: ${hexColor}`);
        }
        if (element.style.backgroundColor && element.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && element.style.backgroundColor !== 'transparent') {
          // Convert rgb to hex
          let hexBackground = element.style.backgroundColor;
          if (element.style.backgroundColor.startsWith('rgb')) {
            const rgb = element.style.backgroundColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              hexBackground = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
          }
          styles.push(`background-color: ${hexBackground}`);
        }
        
        if (styles.length > 0) {
          result = `<span style="${styles.join('; ')}">${result}</span>`;
        }
        
        return result;
      }
    });

    // Handle font elements with color
    turndownService.current.addRule('fontColor', {
      filter: (node) => node.nodeName === 'FONT',
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const color = element.getAttribute('color');
        if (color) {
          return `<span style="color: ${color}">${content}</span>`;
        }
        return content;
      }
    });

    // Handle elements with background color
    turndownService.current.addRule('backgroundColor', {
      filter: (node) => {
        return node.nodeName === 'SPAN' && node.style && node.style.backgroundColor && 
               node.style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
               node.style.backgroundColor !== 'transparent';
      },
      replacement: (content, node) => {
        const element = node as HTMLElement;
        const backgroundColor = element.style.backgroundColor;
        let hexBackground = backgroundColor;
        
        if (backgroundColor.startsWith('rgb')) {
          const rgb = backgroundColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const r = parseInt(rgb[0]);
            const g = parseInt(rgb[1]);
            const b = parseInt(rgb[2]);
            hexBackground = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
        }
        
        return `<span style="background-color: ${hexBackground}">${content}</span>`;
      }
    });

  }, []);

  // Convert markdown to HTML
  const markdownToHtml = useCallback((md: string) => {
    const html = marked(md, {
      breaks: true,
      gfm: true,
    }) as string;
    
    // Add custom styles for headings and other elements
    const styledHtml = html
      .replace(/<h1>/g, '<h1 style="font-size: 1.875rem; font-weight: bold; margin: 1rem 0;">')
      .replace(/<h2>/g, '<h2 style="font-size: 1.5rem; font-weight: bold; margin: 0.875rem 0;">')
      .replace(/<h3>/g, '<h3 style="font-size: 1.25rem; font-weight: bold; margin: 0.75rem 0;">')
      .replace(/<h4>/g, '<h4 style="font-size: 1.125rem; font-weight: bold; margin: 0.625rem 0;">')
      .replace(/<h5>/g, '<h5 style="font-size: 1rem; font-weight: bold; margin: 0.5rem 0;">')
      .replace(/<h6>/g, '<h6 style="font-size: 0.875rem; font-weight: bold; margin: 0.5rem 0;">')
      .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 1rem; margin: 1rem 0; color: #6b7280; font-style: italic;">')
      .replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">')
      .replace(/<ul>/g, '<ul style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: disc; display: block;">')
      .replace(/<ol>/g, '<ol style="margin: 1rem 0; padding-left: 1.5rem; list-style-type: decimal; display: block;">')
      .replace(/<li>/g, '<li style="margin: 0.25rem 0; display: list-item; list-style-position: outside;">')
;
    
         return DOMPurify.sanitize(styledHtml, {
           ADD_ATTR: ['style'],
           ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span', 'hr', 'details', 'summary'],
           ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'color', 'open']
         });
  }, []);

  // Initialize editor content once on mount
  useEffect(() => {
    if (editorRef.current && markdown && !editorRef.current.innerHTML) {
      const initialHtml = markdownToHtml(markdown);
      editorRef.current.innerHTML = initialHtml;
    }
  }, [markdown, markdownToHtml]);

  // Convert HTML to markdown
  const htmlToMarkdown = useCallback((html: string) => {
    if (!turndownService.current) return "";
    return turndownService.current.turndown(html);
  }, []);





  // Update markdown when content prop changes
  useEffect(() => {
    setMarkdown(content);
  }, [content]);

  // Handle content change in the editor - convert to markdown
  const handleEditorChange = useCallback((e?: React.FormEvent) => {
    if (!editorRef.current || !turndownService.current || isUpdatingFromMarkdown.current) return;
    
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
        const newMarkdown = htmlToMarkdown(newHtml);
        
        // Only update if markdown has actually changed to avoid unnecessary re-renders
        if (markdown !== newMarkdown) {
          // Set flag to prevent HTML update during typing
          isUpdatingFromMarkdown.current = true;
          
          // Update markdown state without triggering HTML update
          setMarkdown(newMarkdown);
          onContentChange(newMarkdown);
          
          // Reset flag immediately since we're not updating HTML
          isUpdatingFromMarkdown.current = false;
        }
      }
    }, 300); // Reduced debounce time
  }, [htmlToMarkdown, onContentChange, markdown]);


  // Function to save current selection
  const saveSelection = useCallback(() => {
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
  }, []);

  // Apply formatting to selection
  const applyFormatting = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Save current selection
    const selection = window.getSelection();
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
          const editor = editorRef.current;
          if (editor) {
            const textNodes = [];
            const walker = document.createTreeWalker(
              editor,
              NodeFilter.SHOW_TEXT,
              null,
              false
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
        const editor = editorRef.current;
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
          // Use custom implementation for strikethrough
          if (selectedText) {
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
            
            // Check if text is already strikethrough
            const isStrike = element?.closest('s, del, strike') !== null ||
                            (element as HTMLElement)?.style?.textDecoration?.includes('line-through');
            
            if (isStrike) {
              // Remove strikethrough
              const strikeElement = element?.closest('s, del, strike');
              if (strikeElement) {
                const parent = strikeElement.parentNode;
                while (strikeElement.firstChild) {
                  parent?.insertBefore(strikeElement.firstChild, strikeElement);
                }
                parent?.removeChild(strikeElement);
              }
            } else {
              // Add strikethrough
              const span = document.createElement('s');
              span.textContent = selectedText;
              range.deleteContents();
              range.insertNode(span);
            }
            restoreSelection();
          } else {
            // Toggle strikethrough for current selection
            const isStrike = document.queryCommandState('strikeThrough');
            if (isStrike) {
              document.execCommand('removeFormat', false);
            } else {
              document.execCommand('strikeThrough', false);
            }
            restoreSelection();
          }
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
          const url = prompt('URL du lien:');
          if (url) {
            document.execCommand('createLink', false, url);
            restoreSelection();
          }
          break;
        case 'insertImage':
          const imageUrl = prompt('URL de l\'image:');
          if (imageUrl) {
            document.execCommand('insertImage', false, imageUrl);
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
              // Remove background color
              document.execCommand('removeFormat', false);
            } else {
              document.execCommand('backColor', false, value);
            }
            restoreSelection();
          }
          break;
        case 'undo':
          document.execCommand('undo', false);
          // Restore selection after undo
          setTimeout(() => {
            restoreSelection();
          }, 10);
          break;
        case 'redo':
          document.execCommand('redo', false);
          // Restore selection after redo
          setTimeout(() => {
            restoreSelection();
          }, 10);
          break;
        case 'insertQuote':
          // Check if current selection is already in a blockquote
          const currentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
            ? range.commonAncestorContainer.parentElement 
            : range.commonAncestorContainer as Element;
          const existingBlockquote = currentElement?.closest('blockquote');
          
          if (existingBlockquote) {
            // Remove blockquote - move content out
            const parent = existingBlockquote.parentNode;
            while (existingBlockquote.firstChild) {
              parent?.insertBefore(existingBlockquote.firstChild, existingBlockquote);
            }
            parent?.removeChild(existingBlockquote);
          } else {
            // Add blockquote
            const blockquote = document.createElement('blockquote');
            if (selectedText) {
              blockquote.textContent = selectedText;
              range.deleteContents();
            } else {
              blockquote.textContent = 'Citation';
            }
            range.insertNode(blockquote);
          }
          restoreSelection();
          break;
        case 'insertHorizontalRule':
          const hr = document.createElement('hr');
          range.deleteContents();
          range.insertNode(hr);
          restoreSelection();
          break;
      }
      
      // Immediately convert to markdown after formatting
      setTimeout(() => {
        if (editorRef.current) {
          const newHtml = editorRef.current.innerHTML;
          const newMarkdown = htmlToMarkdown(newHtml);
          
          // Set flag to prevent HTML update during formatting
          isUpdatingFromMarkdown.current = true;
          setMarkdown(newMarkdown);
          onContentChange(newMarkdown);
          
          // Reset flag after a short delay
          setTimeout(() => {
            isUpdatingFromMarkdown.current = false;
          }, 100);
        }
      }, 50);
    } catch (error) {
      console.error('Error applying formatting:', error);
    }
  }, [htmlToMarkdown, onContentChange]);

  // Handle paste events to clean up content
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');
    
    if (pastedData) {
      // Clean the pasted content
      const cleanHtml = DOMPurify.sanitize(pastedData);
      document.execCommand('insertHTML', false, cleanHtml);
      
      setTimeout(() => {
        handleEditorChange();
      }, 0);
    }
  }, [handleEditorChange]);

  // Global undo/redo with selection preservation
  const handleUndo = useCallback(() => {
    const savedSelection = saveSelection();
    document.execCommand('undo', false);
    if (savedSelection) {
      setTimeout(() => {
        try {
          const selection = window.getSelection();
          if (selection && savedSelection.range) {
            selection.removeAllRanges();
            selection.addRange(savedSelection.range);
          }
        } catch (e) {
          console.warn('Undo selection restoration failed:', e);
        }
      }, 10);
    }
  }, [saveSelection]);

  const handleRedo = useCallback(() => {
    const savedSelection = saveSelection();
    document.execCommand('redo', false);
    if (savedSelection) {
      setTimeout(() => {
        try {
          const selection = window.getSelection();
          if (selection && savedSelection.range) {
            selection.removeAllRanges();
            selection.addRange(savedSelection.range);
          }
        } catch (e) {
          console.warn('Redo selection restoration failed:', e);
        }
      }, 10);
    }
  }, [saveSelection]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Ctrl+Z for undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }
    // Handle Ctrl+Shift+Z or Ctrl+Y for redo
    else if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
      e.preventDefault();
      handleRedo();
    }
    // Handle Ctrl+B for bold
    else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      applyFormatting('bold');
    }
    // Handle Ctrl+I for italic
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      applyFormatting('italic');
    }
    // Handle Ctrl+U for underline
    else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      applyFormatting('underline');
    }
    // Handle Ctrl+Shift+> for quote
    else if (e.ctrlKey && e.shiftKey && e.key === '.') {
      e.preventDefault();
      applyFormatting('insertQuote');
    }
    // Handle Ctrl+Shift+- for horizontal rule
    else if (e.ctrlKey && e.shiftKey && e.key === '-') {
      e.preventDefault();
      applyFormatting('insertHorizontalRule');
    }
  }, [applyFormatting, handleUndo, handleRedo]);

  // Expose functions to parent
  useEffect(() => {
    (window as any).applyWysiwygFormatting = applyFormatting;
    (window as any).handleWysiwygUndo = handleUndo;
    (window as any).handleWysiwygRedo = handleRedo;
  }, [applyFormatting, handleUndo, handleRedo]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className={`${className}`}>
      <style jsx>{`
        .wysiwyg-editor ul {
          list-style-type: disc !important;
          margin: 1rem 0 !important;
          padding-left: 1.5rem !important;
          display: block !important;
        }
        .wysiwyg-editor ol {
          list-style-type: decimal !important;
          margin: 1rem 0 !important;
          padding-left: 1.5rem !important;
          display: block !important;
        }
        .wysiwyg-editor li {
          margin: 0.25rem 0 !important;
          display: list-item !important;
          list-style-position: outside !important;
        }
      `}</style>
      <div className="flex">
        {/* Editor */}
        <div className={`flex-1 flex flex-col ${showDebug ? '' : 'w-full'}`}>
          {showDebug && (
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Éditeur WYSIWYG</span>
            </div>
          )}
          <div className="flex-1">
               <div
                 ref={editorRef}
                 contentEditable
                 onInput={handleEditorChange}
                 onPaste={handlePaste}
                 onKeyDown={handleKeyDown}
             className={`wysiwyg-editor ${showDebug ? 'flex-1' : 'w-full'} p-4 border-0 resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 prose prose-sm max-w-none prose-h1:text-3xl prose-h1:font-bold prose-h1:text-gray-900 prose-h1:dark:text-gray-100 prose-h2:text-2xl prose-h2:font-bold prose-h2:text-gray-900 prose-h2:dark:text-gray-100 prose-h3:text-xl prose-h3:font-bold prose-h3:text-gray-900 prose-h3:dark:text-gray-100 prose-h4:text-lg prose-h4:font-bold prose-h4:text-gray-900 prose-h4:dark:text-gray-100 prose-h5:text-base prose-h5:font-bold prose-h5:text-gray-900 prose-h5:dark:text-gray-100 prose-h6:text-sm prose-h6:font-bold prose-h6:text-gray-900 prose-h6:dark:text-gray-100 prose-p:text-gray-900 prose-p:dark:text-gray-100 prose-strong:text-gray-900 prose-strong:dark:text-gray-100 prose-em:text-gray-900 prose-em:dark:text-gray-100 prose-blockquote:text-gray-700 prose-blockquote:dark:text-gray-300 prose-ul:text-gray-900 prose-ul:dark:text-gray-100 prose-ol:text-gray-900 prose-ol:dark:text-gray-100`}
             style={{ 
               minHeight: '200px', 
               maxHeight: 'none',
               // Styles spécifiques pour les listes
               '--tw-prose-ul': 'list-style-type: disc; margin: 1rem 0; padding-left: 1.5rem;',
               '--tw-prose-ol': 'list-style-type: decimal; margin: 1rem 0; padding-left: 1.5rem;',
               '--tw-prose-li': 'margin: 0.25rem 0; display: list-item; list-style-position: outside;'
             } as React.CSSProperties}
            data-placeholder={placeholder}
          />
          </div>
        </div>

        {/* Debug Panel - Only show when debug mode is enabled */}
        {showDebug && (
          <div className="flex-1 flex flex-col border-l border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Variable Markdown (Debug)</span>
            </div>
            <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {markdown || '(vide)'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

