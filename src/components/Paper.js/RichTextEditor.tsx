"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  getLocalStorageData,
  saveTextToLocalStorage,
} from "../../lib/paper.js/localStorage";

interface TextFormatting {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  [key: string]: any;
}

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  textFormatting?: TextFormatting;
  socket?: any;
  onSelectionChange?: (hasSelection: boolean, selectedText: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  disableLocalStorageLoad?: boolean;
}

export default function RichTextEditor({
  content,
  onContentChange,
  textFormatting = {},
  socket,
  onSelectionChange,
  placeholder = "Start typing...",
  className = "",
  disabled = false,
  disableLocalStorageLoad = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load text from localStorage on component mount
  useEffect(() => {
    if (!isInitialized) {
      if (!disableLocalStorageLoad) {
        loadFromLocalStorage();
      }
      setIsInitialized(true);
    }
  }, [isInitialized, disableLocalStorageLoad]);

  const loadFromLocalStorage = () => {
    try {
      const data = getLocalStorageData();
      if (data.text && data.text !== content) {
        onContentChange(data.text); // Restauré pour la capture des données
        if (editorRef.current) {
          editorRef.current.innerHTML = data.text;
        }
      }
    } catch (error) {
      console.error("Error loading text from localStorage:", error);
    }
  };

  const saveTextToLocalStorageCallback = useCallback((text: string) => {
    saveTextToLocalStorage(text);
  }, []);

  // Handle content change
  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onContentChange(newContent); // Restauré pour la capture des données
      saveTextToLocalStorageCallback(newContent);
    }
  };

  // Handle key down events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle special key combinations
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case "b":
          event.preventDefault();
          applyFormatToSelection("bold");
          break;
        case "i":
          event.preventDefault();
          applyFormatToSelection("italic");
          break;
        case "u":
          event.preventDefault();
          applyFormatToSelection("underline");
          break;
        case "s":
          event.preventDefault();
          // Save shortcut
          if (editorRef.current) {
            saveTextToLocalStorageCallback(editorRef.current.innerHTML);
          }
          break;
      }
    }

    // Trigger content change on any key
    setTimeout(handleContentChange, 0);
  }, []);

  // Handle selection events
  const handleSelection = useCallback(() => {
    handleSelectionChange();
  }, []);

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
  const applyFormatToSelection = useCallback(
    (command: string, value?: string) => {
      // Ensure the editor is focused
      if (editorRef.current) {
        editorRef.current.focus();
      }

      // Check if command is supported (skip for custom commands)
      if (
        command !== "insertHTML" &&
        command !== "styleWithCSS" &&
        (!document.queryCommandSupported ||
          !document.queryCommandSupported(command))
      ) {
        console.warn(`Command ${command} not supported`);
        return;
      }

      try {
        // Handle special commands
        if (command === "styleWithCSS") {
          document.execCommand("styleWithCSS", false, value || "false");
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
        console.error("Error applying format:", error);
      }
    },
    [handleContentChange]
  );

  // Expose formatting function globally for toolbar access
  useEffect(() => {
    (window as any).applyRichTextFormat = applyFormatToSelection;
    return () => {
      delete (window as any).applyRichTextFormat;
    };
  }, [applyFormatToSelection]);

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        if (content !== "") {
          saveTextToLocalStorageCallback(content);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [saveTextToLocalStorageCallback]);

  // Auto-save on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        if (content !== "") {
          saveTextToLocalStorageCallback(content);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveTextToLocalStorageCallback]);

  // Handle incoming text updates
  useEffect(() => {
    if (!socket) return;

    const handleIncomingText = (data: any) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
      onContentChange(data.content); // Restauré pour la capture des données
      saveTextToLocalStorageCallback(data.content);
    };

    socket.on("text-update", handleIncomingText);

    return () => {
      socket.off("text-update", handleIncomingText);
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

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        className={`w-full h-full p-4 border-none outline-none bg-gray-100 dark:bg-gray-800 ${disabled ? "cursor-not-allowed" : ""} ${className}`}
        style={{
          color: textFormatting.color,
          backgroundColor: textFormatting.backgroundColor,
          fontSize: `${textFormatting.fontSize}px`,
          fontFamily: textFormatting.fontFamily,
          fontWeight: textFormatting.fontWeight,
          textAlign: textFormatting.textAlign as any,
          minHeight: "100%",
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
        }}
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        suppressContentEditableWarning={true}
        data-placeholder={content.length === 0 ? placeholder : ""}
      />
    </div>
  );
}

