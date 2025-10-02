'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getLocalStorageData, saveTextToLocalStorage } from '../../lib/paper.js/localStorage';

export default function SimpleRichTextEditor({ 
  content, 
  onContentChange, 
  textFormatting, 
  socket,
  onSelectionChange 
}) {
  const editorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load text from localStorage on component mount
  useEffect(() => {
    if (!isInitialized) {
      loadFromLocalStorage();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const loadFromLocalStorage = () => {
    try {
      const data = getLocalStorageData();
      if (data.text && data.text !== content) {
        onContentChange(data.text);
        if (editorRef.current) {
          editorRef.current.innerHTML = data.text;
        }
      }
    } catch (error) {
      console.error('Error loading text from localStorage:', error);
    }
  };

  const saveTextToLocalStorageCallback = useCallback((text) => {
    saveTextToLocalStorage(text);
  }, []);

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onContentChange(newContent);
      saveTextToLocalStorageCallback(newContent);
    }
  };

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && onSelectionChange) {
      const selectedText = selection.toString();
      const hasSelection = selectedText.length > 0;
      onSelectionChange(hasSelection, selectedText);
    }
  }, [onSelectionChange]);

  // Apply formatting to selected text
  const applyFormatToSelection = useCallback((command, value) => {
    // Ensure the editor is focused
    if (editorRef.current) {
      editorRef.current.focus();
    }

    // Check if command is supported (skip for custom commands)
    if (command !== 'insertHTML' && command !== 'styleWithCSS' && 
        (!document.queryCommandSupported || !document.queryCommandSupported(command))) {
      console.warn(`Command ${command} not supported`);
      return;
    }

    try {
      // Handle special commands
      if (command === 'styleWithCSS') {
        document.execCommand('styleWithCSS', false, value || 'false');
        return;
      }

      // Execute the command
      const success = document.execCommand(command, false, value);
      
      if (success) {
        handleContentChange();
      } else {
        console.warn(`Command ${command} failed`);
      }
    } catch (error) {
      console.error('Error applying format:', error);
    }
  }, [handleContentChange]);

  // Expose formatting function globally for toolbar access
  useEffect(() => {
    window.applyRichTextFormat = applyFormatToSelection;
    return () => {
      delete window.applyRichTextFormat;
    };
  }, [applyFormatToSelection]);

  // Auto-save periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (editorRef.current && content) {
        saveTextToLocalStorageCallback(editorRef.current.innerHTML);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [content, saveTextToLocalStorageCallback]);

  // Save on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorRef.current) {
        saveTextToLocalStorageCallback(editorRef.current.innerHTML);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveTextToLocalStorageCallback]);

  // Handle incoming text updates
  useEffect(() => {
    if (!socket) return;

    const handleIncomingText = (data) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
      onContentChange(data.content);
      saveTextToLocalStorageCallback(data.content);
    };

    socket.on('text-update', handleIncomingText);
    
    return () => {
      socket.off('text-update', handleIncomingText);
    };
  }, [socket, onContentChange, saveTextToLocalStorageCallback]);

  // Update content when prop changes (but only if different from current)
  useEffect(() => {
    if (editorRef.current && isInitialized) {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content, isInitialized]);

  // Add selection event listeners
  useEffect(() => {
    const handleMouseUp = () => setTimeout(handleSelectionChange, 0);
    const handleKeyUp = () => setTimeout(handleSelectionChange, 0);

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onPaste={(e) => {
          // Allow paste but handle content change
          setTimeout(() => handleContentChange(), 0);
        }}
        className="w-full h-full p-4 border-none resize-none focus:outline-none leading-relaxed overflow-auto"
        style={{
          minHeight: '100%',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
        suppressContentEditableWarning={true}
        data-placeholder="Start typing... Select text to format it!"
      />
      
      <div className="absolute bottom-4 right-4 text-sm text-gray-500">
        Auto-saved locally • Rich Text Mode
      </div>
    </div>
  );
}