"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import RichTextEditor from "./RichTextEditor";
import Toolbar from "./Toolbar/Toolbar.js";
import { useSocket } from "../../lib/paper.js/socket";

const DrawingCanvas = dynamic(() => import("./DrawingCanvas"), {
  ssr: true,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="text-gray-500">Loading drawing canvas...</div>
    </div>
  ),
});

export default function CollaborativeNotepad({
  roomId = "default-room",
  documentId,
  userId,
  initialData,
  onContentChange,
  localMode = false,
  placeholder = "Start typing...",
  className = "",
  initialContent = "",
}) {
  // default to text mode so users see the editor on page load
  const [mode, setMode] = useState("text");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [content, setContent] = useState("");
  const [drawings, setDrawings] = useState([]);
  const [textFormatting, setTextFormatting] = useState({
    color: "#000000",
    backgroundColor: "transparent",
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "normal",
    textAlign: "left",
  });
  const drawingsTimeoutRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canvasControls, setCanvasControls] = useState(null);

  const { socket, isConnected } = useSocket(localMode ? null : roomId);

  useEffect(() => {
    if (isInitialized) return;

    if (initialData) {
      let dbTextContent = "";
      let dbDrawings = [];
      let dbTextFormatting = {};

      try {
        if (typeof initialData.text === "string") {
          dbTextContent = initialData.text;
        } else if (initialData.text_content) {
          dbTextContent = initialData.text_content;
        } else if (initialData.content) {
          try {
            const parsed = JSON.parse(initialData.content);
            dbTextContent = parsed.text || initialData.content;
            dbDrawings = parsed.drawings || [];
            dbTextFormatting = parsed.textFormatting || {};
          } catch (e) {
            dbTextContent = initialData.content;
          }
        }

        if (initialData.drawings) {
          dbDrawings = initialData.drawings;
        } else if (initialData.drawings_data) {
          dbDrawings = Array.isArray(initialData.drawings_data)
            ? initialData.drawings_data
            : JSON.parse(initialData.drawings_data || "[]");
        }

        if (initialData.textFormatting) {
          dbTextFormatting = initialData.textFormatting;
        } else if (initialData.text_formatting) {
          dbTextFormatting =
            typeof initialData.text_formatting === "object"
              ? initialData.text_formatting
              : JSON.parse(initialData.text_formatting || "{}");
        }
      } catch (error) {
        dbTextContent = initialData.text ?? initialData.content ?? "";
      }

      setContent(dbTextContent);
      setDrawings(dbDrawings);
      setTextFormatting((prev) => ({ ...prev, ...dbTextFormatting }));
    } else if (initialContent) {
      setContent(initialContent);
    } else {
      // defaults already set in state initialization
    }

    setIsInitialized(true);
  }, [initialData, initialContent, isInitialized]);

  useEffect(() => {
    if (socket && documentId && !localMode) {
      socket.emit("join-document", documentId);
    }
  }, [socket, documentId, localMode]);

  useEffect(() => {
    if (!socket || localMode) return;

    const handleDocumentState = (data) => {
      if (!isInitialized) return;
      setContent(data.content || "");
      setDrawings(data.drawings || []);
      if (data.textFormatting) {
        setTextFormatting((prev) => ({ ...prev, ...data.textFormatting }));
      }
    };

    const handleDrawingData = (data) => {
      setDrawings((prev) => [...prev, data.drawingData]);
    };

    const handleTextUpdate = (data) => {
      setContent(data.content);
    };

    const handleTextFormattingUpdate = (data) => {
      setTextFormatting((prev) => ({ ...prev, ...data.formatting }));
    };

    const handleClearCanvas = () => {
      setContent("");
      setDrawings([]);
    };

    socket.on("document-state", handleDocumentState);
    socket.on("drawing-data", handleDrawingData);
    socket.on("text-update", handleTextUpdate);
    socket.on("text-formatting-update", handleTextFormattingUpdate);
    socket.on("clear-canvas", handleClearCanvas);

    return () => {
      socket.off("document-state", handleDocumentState);
      socket.off("drawing-data", handleDrawingData);
      socket.off("text-update", handleTextUpdate);
      socket.off("text-formatting-update", handleTextFormattingUpdate);
      socket.off("clear-canvas", handleClearCanvas);
    };
  }, [socket, localMode, isInitialized]);

  const handleDrawingData = (data) => {
    setDrawings((prev) => [...prev, data]);

    // Clear existing timeout
    if (drawingsTimeoutRef.current) {
      clearTimeout(drawingsTimeoutRef.current);
    }

    // Set new timeout for debounced onContentChange
    drawingsTimeoutRef.current = setTimeout(() => {
      if (onContentChange) {
        onContentChange(
          JSON.stringify({
            text: content,
            drawings: [...drawings, data],
            textFormatting: textFormatting,
            timestamp: Date.now(),
          })
        );
      }
    }, 100); // 100ms debounce

    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit("drawing-data", {
        documentId,
        userId,
        drawingData: data,
      });
    }
  };

  const handleTextChange = (newContent) => {
    setContent(newContent);

    // immediately send current content (use newContent rather than state)
    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit("text-update", {
        documentId,
        userId,
        content: newContent,
      });
    }

    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleTextFormattingChange = (formatting) => {
    const newFormatting = { ...textFormatting, ...formatting };
    setTextFormatting(newFormatting);

    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit("text-formatting-update", {
        documentId,
        userId,
        formatting: newFormatting,
      });
    }
  };

  // Auto-save when content or formatting changes (excluding drawings to avoid loops)
  useEffect(() => {
    if (onContentChange) {
      onContentChange(
        JSON.stringify({
          text: content,
          drawings: drawings,
          textFormatting: textFormatting,
          timestamp: Date.now(),
        })
      );
    }
  }, [textFormatting, content, onContentChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (drawingsTimeoutRef.current) {
        clearTimeout(drawingsTimeoutRef.current);
      }
    };
  }, []);

  const clearAllData = () => {
    if (
      confirm("Are you sure you want to clear all data? This cannot be undone.")
    ) {
      setContent("");
      setDrawings([]);
      setTextFormatting({
        color: "#000000",
        backgroundColor: "transparent",
        fontSize: 16,
        fontFamily: "Inter, sans-serif",
        fontWeight: "normal",
        textAlign: "left",
      });

      const editor = document.querySelector("[contenteditable]");
      if (editor) {
        editor.innerHTML = "";
      }
    }
  };

  useEffect(() => {
    if (!canvasControls) return;
    const ctrl = canvasControls.current ?? canvasControls;
    try {
      if (typeof ctrl.setMode === "function") {
        ctrl.setMode(mode === "draw" ? "drawing" : "text");
      }

      // When switching to draw mode, render the current HTML text into the canvas as an overlay
      if (mode === "draw") {
        const tryRender = (attempt = 0) => {
          try {
            if (typeof ctrl.renderTextFromHTML === "function") {
              // get editor padding to match appearance
              const editorEl = document.querySelector("[contenteditable]");
              let padding = null;
              if (editorEl) {
                const cs = window.getComputedStyle(editorEl);
                const pt = cs.paddingTop || "0px";
                const pr = cs.paddingRight || "0px";
                const pb = cs.paddingBottom || "0px";
                const pl = cs.paddingLeft || "0px";
                padding = `${pt} ${pr} ${pb} ${pl}`;
              }

              // Utiliser les valeurs actuelles sans les inclure dans les dépendances
              const currentContent = content;
              const currentTextFormatting = textFormatting;
              const formattingWithPadding = { ...currentTextFormatting };
              if (padding) formattingWithPadding.padding = padding;

              ctrl.renderTextFromHTML(currentContent, formattingWithPadding);
              return true;
            }
          } catch (e) {
            // fallthrough to retry
          }

          // retry once after a short delay if not yet available
          if (attempt === 0) {
            setTimeout(() => tryRender(1), 300);
          }
          return false;
        };

        tryRender(0);
      }

      // When switching to text mode, clear any text overlay so the editor shows the live content
      if (mode === "text" && typeof ctrl.clearTextOverlay === "function") {
        ctrl.clearTextOverlay();
      }
    } catch (e) {
      // ignore
    }
  }, [canvasControls, mode]);

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col ${className || ""}`}>
      <Toolbar
        mode={mode}
        setMode={setMode}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        textFormatting={textFormatting}
        setTextFormatting={setTextFormatting}
        isConnected={isConnected}
        onClearAllData={clearAllData}
      />

      <div className="flex-1 relative">
        <div
          className={`absolute inset-0 ${mode === "draw" ? "z-10" : "z-0 pointer-events-none"}`}
          style={{
            backgroundColor: mode === "text" ? "white" : "transparent",
          }}
        >
          <DrawingCanvas
            brushColor={brushColor}
            brushSize={brushSize}
            onDrawingData={handleDrawingData}
            socket={localMode ? null : socket}
            drawings={drawings}
            setDrawings={setDrawings}
            onCanvasReady={setCanvasControls}
          />
        </div>

        <div
          className={`absolute inset-0 ${mode === "text" ? "z-10" : "z-0"} ${mode === "draw" ? "pointer-events-none" : ""}`}
          style={{
            backgroundColor: mode === "draw" ? "white" : "transparent",
          }}
        >
          <RichTextEditor
            content={content}
            onContentChange={handleTextChange}
            textFormatting={textFormatting}
            socket={localMode ? null : socket}
            placeholder={placeholder}
            className="w-full h-fit"
            disabled={mode === "draw"}
            disableLocalStorageLoad={localMode && !documentId}
            style={{
              backgroundColor: mode === "draw" ? "white" : "transparent",
            }}
          />
        </div>
      </div>
    </div>
  );
}
