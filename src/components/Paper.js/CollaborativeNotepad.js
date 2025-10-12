"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import RichTextEditor from "./RichTextEditor";
import ClientOnlyDrawingCanvas from "./ClientOnlyDrawingCanvas";
import Toolbar from "./Toolbar/Toolbar";
import { useSocket } from "@/lib/paper.js/socket";
import { useLocalSession } from "@/hooks/useLocalSession";

export default function CollaborativeNotepad({
  initialData = { text: "", drawings: [], textFormatting: {} },
  useLocalStorage = false,
  calMode = false,
  onContentChange,
  onCanvasReady,
  placeholder = "Commencez à écrire...",
  className = "",
  ...props
}) {
  // -------- State management --------
  const [text, setText] = useState(initialData.text || "");
  const [drawings, setDrawings] = useState(initialData.drawings || []);
  const [textFormatting, setTextFormatting] = useState(
    initialData.textFormatting || {}
  );
  const [mode, setMode] = useState("text");
  const [isInitialized, setIsInitialized] = useState(false);
  const [drawingState, setDrawingState] = useState({
    color: "#000000",
    size: 3,
    opacity: 1,
  });

  // Refs
  const drawingsTimeoutRef = useRef(null);
  const hasLoadedInitialDrawingsRef = useRef(false);
  const canvasCtrlRef = useRef(null);

  // Session
  const { session, isLoggedIn } = useLocalSession();

  // Socket
  const { socket, localMode } = useSocket();

  // -------- Content normalization --------
  const normalizeContent = (rawContent) => {
    if (!rawContent) return { text: "", drawings: [], textFormatting: {} };

    let content = rawContent;

    // Parse if string
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        return { text: content, drawings: [], textFormatting: {} };
      }
    }

    // Ensure proper structure
    return {
      text: content.text || "",
      drawings: Array.isArray(content.drawings) ? content.drawings : [],
      textFormatting: content.textFormatting || {},
      timestamp: content.timestamp || Date.now(),
    };
  };

  // -------- Content change handling --------
  const handleContentChange = useCallback(
    (newContent) => {
      const normalized = normalizeContent(newContent);

      setText(normalized.text);
      setDrawings(normalized.drawings);
      setTextFormatting(normalized.textFormatting);

      // Notify parent
      if (onContentChange) {
        onContentChange(normalized);
      }
    },
    [onContentChange]
  );

  // -------- Clear all data handler --------
  const handleClearAllData = useCallback(() => {
    setText("");
    setDrawings([]);
    setTextFormatting({});

    // Clear the Paper.js canvas if available
    if (canvasCtrlRef.current) {
      canvasCtrlRef.current.clearCanvas?.();
    }

    const clearedContent = {
      text: "",
      drawings: [],
      textFormatting: {},
      timestamp: Date.now(),
    };

    onContentChange?.(clearedContent);
  }, [onContentChange]);

  // -------- Clear drawings only handler --------
  const handleClearDrawings = useCallback(() => {
    setDrawings([]);

    // Clear the Paper.js canvas if available
    if (canvasCtrlRef.current) {
      canvasCtrlRef.current.clearCanvas?.();
    }

    // Update content with current text but empty drawings
    const updatedContent = {
      text: text,
      drawings: [],
      textFormatting: textFormatting,
      timestamp: Date.now(),
    };

    onContentChange?.(updatedContent);
  }, [text, textFormatting, onContentChange]);

  // -------- Drawing handling --------
  const handleDrawingData = useCallback(
    (data) => {
      setDrawings((prev) => {
        const newDrawings = [...prev, data];

        // Clear existing timeout
        if (drawingsTimeoutRef.current) {
          clearTimeout(drawingsTimeoutRef.current);
        }

        // Set timeout to notify parent
        drawingsTimeoutRef.current = setTimeout(() => {
          const updatedContent = {
            text,
            drawings: newDrawings,
            textFormatting,
            timestamp: Date.now(),
          };

          if (onContentChange) {
            onContentChange(updatedContent);
          }
        }, 100);

        return newDrawings;
      });
    },
    [text, textFormatting, onContentChange]
  );

  // -------- Text formatting handling --------
  const handleTextFormattingChange = useCallback(
    (newFormatting) => {
      setTextFormatting(newFormatting);

      const updatedContent = {
        text,
        drawings,
        textFormatting: newFormatting,
        timestamp: Date.now(),
      };

      if (onContentChange) {
        onContentChange(updatedContent);
      }
    },
    [text, drawings, onContentChange]
  );

  // -------- Text change handling --------
  const handleTextChange = useCallback(
    (newText) => {
      setText(newText);

      const updatedContent = {
        text: newText,
        drawings,
        textFormatting,
        timestamp: Date.now(),
      };

      if (onContentChange) {
        onContentChange(updatedContent);
      }
    },
    [drawings, textFormatting, onContentChange]
  );

  // -------- Canvas ready handling --------
  const handleCanvasReady = useCallback(
    (canvasCtrl) => {
      canvasCtrlRef.current = canvasCtrl;
      if (onCanvasReady) {
        onCanvasReady(canvasCtrl);
      }
    },
    [onCanvasReady]
  );

  // -------- Socket event handlers --------
  const handleTextUpdate = useCallback(
    (data) => {
      if (data.userId !== session?.user?.id && data.text !== undefined) {
        setText(data.text);
      }
    },
    [session?.user?.id]
  );

  const handleDrawingUpdate = useCallback(
    (data) => {
      if (data.userId !== session?.user?.id && data.drawings) {
        setDrawings(data.drawings);
      }
    },
    [session?.user?.id]
  );

  const handleTextFormattingUpdate = useCallback(
    (data) => {
      if (data.userId !== session?.user?.id && data.textFormatting) {
        setTextFormatting(data.textFormatting);
      }
    },
    [session?.user?.id]
  );

  const handleClearCanvas = useCallback(() => {
    setDrawings([]);
  }, []);

  // -------- Socket setup --------
  useEffect(() => {
    if (!socket || localMode || !isLoggedIn) return;

    socket.on("text-update", handleTextUpdate);
    socket.on("drawing-update", handleDrawingUpdate);
    socket.on("text-formatting-update", handleTextFormattingUpdate);
    socket.on("clear-canvas", handleClearCanvas);

    return () => {
      socket.off("text-update", handleTextUpdate);
      socket.off("drawing-update", handleDrawingUpdate);
      socket.off("text-formatting-update", handleTextFormattingUpdate);
      socket.off("clear-canvas", handleClearCanvas);
    };
  }, [
    socket,
    localMode,
    isLoggedIn,
    handleTextUpdate,
    handleDrawingUpdate,
    handleTextFormattingUpdate,
    handleClearCanvas,
  ]);

  // -------- Initialization --------
  useEffect(() => {
    if (!isInitialized) {
      const normalized = normalizeContent(initialData);
      setText(normalized.text);
      setDrawings(normalized.drawings);
      setTextFormatting(normalized.textFormatting);
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // -------- Cleanup --------
  useEffect(() => {
    return () => {
      if (drawingsTimeoutRef.current) {
        clearTimeout(drawingsTimeoutRef.current);
      }
    };
  }, []);

  // -------- Render --------
  return (
    <div className={`flex flex-col h-full ${className}`} {...props}>
      {/* Toolbar */}
      <Toolbar
        mode={mode}
        setMode={setMode}
        textFormatting={textFormatting}
        setTextFormatting={handleTextFormattingChange}
        brushColor={drawingState.color}
        setBrushColor={(color) =>
          setDrawingState((prev) => ({ ...prev, color }))
        }
        brushSize={drawingState.size}
        setBrushSize={(size) => setDrawingState((prev) => ({ ...prev, size }))}
        onClearAllData={handleClearAllData}
        onClearDrawings={handleClearDrawings}
        calMode={calMode}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Text Editor - Always visible */}
        <div
          className={`flex-1 ${mode === "draw" ? "opacity-30 pointer-events-none" : ""}`}
        >
          <RichTextEditor
            content={text}
            onContentChange={handleTextChange}
            textFormatting={textFormatting}
            onSelectionChange={handleTextFormattingChange}
            placeholder={placeholder}
            className="flex-1"
            disableLocalStorageLoad={true}
          />
        </div>

        {/* Drawing Canvas - Always present but hidden when not in draw mode */}
        <div
          className={`absolute inset-0 z-10`}
          style={{ pointerEvents: mode === "draw" ? "auto" : "none" }}
        >
          {console.log("Rendering DrawingCanvas with mode:", mode)}
          <ClientOnlyDrawingCanvas
            drawings={drawings}
            setDrawings={setDrawings}
            onDrawingData={handleDrawingData}
            onCanvasReady={handleCanvasReady}
            className="w-full h-full"
            hasLoadedInitialDrawingsRef={hasLoadedInitialDrawingsRef}
            mode={mode}
            drawingState={drawingState}
            setDrawingState={setDrawingState}
          />
        </div>
      </div>
    </div>
  );
}
