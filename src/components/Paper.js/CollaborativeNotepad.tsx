"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import RichTextEditor from "./RichTextEditor";
import ClientOnlyDrawingCanvas from "./ClientOnlyDrawingCanvas";
import Toolbar from "./Toolbar/Toolbar";
import { useSocket } from "@/lib/paper.js/socket";
import { useLocalSession } from "@/hooks/useLocalSession";

interface Drawing {
  segments: Array<{
    point: [number, number];
    handleIn?: [number, number] | null;
    handleOut?: [number, number] | null;
  }>;
  color: string;
  size: number;
  opacity: number;
  closed?: boolean;
}

interface TextFormatting {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  [key: string]: any;
}

interface NotepadContent {
  text: string;
  drawings: Drawing[];
  textFormatting: TextFormatting;
  timestamp?: number;
}

interface DrawingState {
  color: string;
  size: number;
  opacity: number;
}

interface CanvasController {
  clearCanvas?: () => void;
  saveDrawings?: () => Promise<Drawing[]>;
  setDrawingState?: (state: Partial<DrawingState>) => void;
}

interface CollaborativeNotepadProps {
  initialData?: Partial<NotepadContent>;
  useLocalStorage?: boolean;
  calMode?: boolean;
  onContentChange?: (content: NotepadContent) => void;
  onCanvasReady?: (canvasCtrl: CanvasController) => void;
  placeholder?: string;
  className?: string;
  [key: string]: any;
}

export default function CollaborativeNotepad({
  initialData = { text: "", drawings: [], textFormatting: {} },
  useLocalStorage = false,
  calMode = false,
  onContentChange,
  onCanvasReady,
  placeholder = "Commencez à écrire...",
  className = "",
  ...props
}: CollaborativeNotepadProps) {
  // -------- State management --------
  const [text, setText] = useState(initialData.text || "");
  const [drawings, setDrawings] = useState<Drawing[]>(initialData.drawings || []);
  const [textFormatting, setTextFormatting] = useState<TextFormatting>(
    initialData.textFormatting || {}
  );
  const [mode, setMode] = useState<string>("text");
  const [isInitialized, setIsInitialized] = useState(false);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    color: "#000000",
    size: 3,
    opacity: 1,
  });

  // Refs
  const drawingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitialDrawingsRef = useRef(false);
  const canvasCtrlRef = useRef<CanvasController | null>(null);

  // Session
  const { userId, isLoggedIn } = useLocalSession();

  // Socket
  const { socket } = useSocket();

  // -------- Content normalization --------
  const normalizeContent = (rawContent: any): NotepadContent => {
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
    (newContent: any) => {
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

    const clearedContent: NotepadContent = {
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
    const updatedContent: NotepadContent = {
      text: text,
      drawings: [],
      textFormatting: textFormatting,
      timestamp: Date.now(),
    };

    onContentChange?.(updatedContent);
  }, [text, textFormatting, onContentChange]);

  // -------- Drawing handling --------
  const handleDrawingData = useCallback(
    (data: Drawing) => {
      setDrawings((prev) => {
        const newDrawings = [...prev, data];

        // Clear existing timeout
        if (drawingsTimeoutRef.current) {
          clearTimeout(drawingsTimeoutRef.current);
        }

        // Set timeout to notify parent
        drawingsTimeoutRef.current = setTimeout(() => {
          const updatedContent: NotepadContent = {
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
    (newFormatting: TextFormatting) => {
      setTextFormatting(newFormatting);

      const updatedContent: NotepadContent = {
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
    (newText: string) => {
      setText(newText);

      const updatedContent: NotepadContent = {
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
    (canvasCtrl: CanvasController) => {
      canvasCtrlRef.current = canvasCtrl;
      if (onCanvasReady) {
        onCanvasReady(canvasCtrl);
      }
    },
    [onCanvasReady]
  );

  // -------- Socket event handlers --------
  const handleTextUpdate = useCallback(
    (data: any) => {
      if (data.userId !== userId && data.text !== undefined) {
        setText(data.text);
      }
    },
    [userId]
  );

  const handleDrawingUpdate = useCallback(
    (data: any) => {
      if (data.userId !== userId && data.drawings) {
        setDrawings(data.drawings);
      }
    },
    [userId]
  );

  const handleTextFormattingUpdate = useCallback(
    (data: any) => {
      if (data.userId !== userId && data.textFormatting) {
        setTextFormatting(data.textFormatting);
      }
    },
    [userId]
  );

  const handleClearCanvas = useCallback(() => {
    setDrawings([]);
  }, []);

  // -------- Socket setup --------
  useEffect(() => {
    if (!socket || !isLoggedIn) return;

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
        setBrushColor={(color: string) =>
          setDrawingState((prev) => ({ ...prev, color }))
        }
        brushSize={drawingState.size}
        setBrushSize={(size: number) => setDrawingState((prev) => ({ ...prev, size }))}
        onClearAllData={handleClearAllData}
        onClearDrawings={handleClearDrawings}
        calMode={calMode}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-gray-100 dark:bg-gray-800">
        {/* Text Editor - Always visible */}
        <div
          className={`flex-1 ${mode === "draw" ? "opacity-30 pointer-events-none" : ""}`}
        >
          <RichTextEditor
            content={text}
            onContentChange={handleTextChange}
            textFormatting={textFormatting}
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

