"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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

interface DrawingState {
  color: string;
  size: number;
  opacity: number;
}

interface CanvasController {
  saveDrawings: () => Promise<Drawing[]>;
  clearCanvas: () => void;
  setDrawingState: (state: Partial<DrawingState>) => void;
}

interface DrawingCanvasProps {
  drawings?: Drawing[];
  setDrawings: (drawings: Drawing[] | ((prev: Drawing[]) => Drawing[])) => void;
  onDrawingData?: (drawing: Drawing) => void;
  onCanvasReady?: (canvasCtrl: CanvasController) => void;
  className?: string;
  hasLoadedInitialDrawingsRef?: React.MutableRefObject<boolean>;
  mode?: string;
  drawingState?: DrawingState;
  setDrawingState?: (state: DrawingState | ((prev: DrawingState) => DrawingState)) => void;
  [key: string]: any;
}

export default function DrawingCanvas({
  drawings = [],
  setDrawings,
  onDrawingData,
  onCanvasReady,
  className = "",
  hasLoadedInitialDrawingsRef,
  mode = "draw",
  drawingState: propDrawingState,
  setDrawingState: propSetDrawingState,
  ...props
}: DrawingCanvasProps) {
  // -------- State management --------
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<any>(null);
  const [paperScope, setPaperScope] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperRef = useRef<any>(null);
  const clientIdRef = useRef<string | null>(null);
  const pathsRef = useRef(new Map());
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<any>(null);
  const modeRef = useRef(mode);

  // Session
  const { session, isLoggedIn } = useLocalSession();

  // Socket
  const { socket } = useSocket();
  const localMode = true; // Force local mode for now

  // -------- Drawing state --------
  const [localDrawingState, setLocalDrawingState] = useState<DrawingState>({
    color: "#000000",
    size: 3,
    opacity: 1,
  });

  // Use prop drawing state if available, otherwise use local state
  const drawingState = propDrawingState || localDrawingState;
  const setDrawingState = propSetDrawingState || setLocalDrawingState;

  // Canvas dimensions state
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Update refs when state changes
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Sync drawings from canvas to state when they change
  const syncDrawingsToState = useCallback(() => {
    if (!paperScope) return;

    const allPaths: Drawing[] = [];
    paperScope.project.activeLayer.children.forEach((item: any) => {
      if (item.className === "Path") {
        const serializedPath: Drawing = {
          segments: item.segments.map((segment: any) => ({
            point: [segment.point.x, segment.point.y] as [number, number],
            handleIn: segment.handleIn
              ? ([segment.handleIn.x, segment.handleIn.y] as [number, number])
              : null,
            handleOut: segment.handleOut
              ? ([segment.handleOut.x, segment.handleOut.y] as [number, number])
              : null,
          })),
          color: item.strokeColor?.toCSS() || "#000000",
          size: item.strokeWidth || 3,
          opacity: item.opacity || 1,
          closed: item.closed || false,
        };
        allPaths.push(serializedPath);
      }
    });

    // Always update the state with current canvas drawings
    setDrawings(allPaths);
  }, [paperScope, setDrawings]);

  // Mode is now passed as prop

  // -------- Paper.js setup --------
  const initializePaper = useCallback(async () => {
    if (!canvasRef.current || isInitialized || typeof window === "undefined")
      return;
    try {
      const paper = (await import("paper")).default;
      paperRef.current = paper;

      const canvas = canvasRef.current;

      // Set canvas size based on container
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      paper.setup(canvas);

      // Set view size to match canvas size
      paper.view.viewSize = new paper.Size(rect.width, rect.height);

      // Set up drawing tools
      const tool = new paper.Tool();

      tool.onMouseDown = (event: any) => {
        if (modeRef.current !== "draw") {
          return;
        }
        setIsDrawing(true);
        isDrawingRef.current = true;

        const path = new paper.Path();
        path.strokeColor = new paper.Color(drawingState.color);
        path.strokeWidth = drawingState.size;
        path.strokeCap = "round";
        path.strokeJoin = "round";
        path.opacity = drawingState.opacity;

        path.add(event.point);
        setCurrentPath(path);
        currentPathRef.current = path;

        // Store in paths map
        const pathId = `path-${Date.now()}-${Math.random()}`;
        pathsRef.current.set(pathId, path);
      };

      tool.onMouseDrag = (event: any) => {
        if (
          !isDrawingRef.current ||
          !currentPathRef.current ||
          modeRef.current !== "draw"
        ) {
          return;
        }

        currentPathRef.current.add(event.point);
        paper.view.update();
      };

      tool.onMouseUp = (event: any) => {
        if (
          !isDrawingRef.current ||
          !currentPathRef.current ||
          modeRef.current !== "draw"
        ) {
          return;
        }

        setIsDrawing(false);
        isDrawingRef.current = false;

        // Finalize path
        currentPathRef.current.simplify(2);

        // Convert to serializable format
        const serializedPath: Drawing = {
          segments: currentPathRef.current.segments.map((segment: any) => ({
            point: [segment.point.x, segment.point.y] as [number, number],
            handleIn: segment.handleIn
              ? ([segment.handleIn.x, segment.handleIn.y] as [number, number])
              : null,
            handleOut: segment.handleOut
              ? ([segment.handleOut.x, segment.handleOut.y] as [number, number])
              : null,
          })),
          color: drawingState.color,
          size: drawingState.size,
          opacity: drawingState.opacity,
          closed: currentPathRef.current.closed,
        };

        // Add to drawings
        setDrawings((prev) => {
          const newDrawings = [...prev, serializedPath];

          // Notify parent
          if (onDrawingData) {
            onDrawingData(serializedPath);
          }

          return newDrawings;
        });

        setCurrentPath(null);
        currentPathRef.current = null;
        paper.view.update();

        // Sync drawings to state
        setTimeout(() => {
          syncDrawingsToState();
        }, 100);
      };

      setPaperScope(paper);
      setIsInitialized(true);

      // Notify parent that canvas is ready
      if (onCanvasReady) {
        onCanvasReady({
          saveDrawings: async () => {
            // Sync current drawings to state first
            syncDrawingsToState();

            // Get all paths from the canvas and convert them to serializable format
            const allPaths: Drawing[] = [];
            paper.project.activeLayer.children.forEach((item: any, index: number) => {
              if (item.className === "Path") {
                const serializedPath: Drawing = {
                  segments: item.segments.map((segment: any) => ({
                    point: [segment.point.x, segment.point.y] as [number, number],
                    handleIn: segment.handleIn
                      ? ([segment.handleIn.x, segment.handleIn.y] as [number, number])
                      : null,
                    handleOut: segment.handleOut
                      ? ([segment.handleOut.x, segment.handleOut.y] as [number, number])
                      : null,
                  })),
                  color: item.strokeColor?.toCSS() || "#000000",
                  size: item.strokeWidth || 3,
                  opacity: item.opacity || 1,
                  closed: item.closed || false,
                };
                allPaths.push(serializedPath);
              }
            });
            return allPaths;
          },
          clearCanvas: () => {
            paper.project.clear();
            pathsRef.current.clear();
            setDrawings([]);
          },
          setDrawingState: (newState: Partial<DrawingState>) => {
            setDrawingState((prev) => ({ ...prev, ...newState }));
          },
        });
      }
    } catch (error) {
      console.error("Error initializing Paper.js:", error);
    }
  }, [
    isInitialized,
    drawingState,
    mode,
    onDrawingData,
    onCanvasReady,
    setDrawings,
    syncDrawingsToState,
    setDrawingState,
  ]);

  // -------- Load initial drawings --------
  useEffect(() => {
    if (!paperScope || !isInitialized) return;

    // Clear existing paths
    paperScope.project.clear();
    pathsRef.current.clear();

    // Load drawings
    if (Array.isArray(drawings) && drawings.length > 0) {
      drawings.forEach((drawing, index) => {
        if (!drawing || !drawing.segments) return;

        try {
          const path = new paperScope.Path();
          path.strokeColor = new paperScope.Color(drawing.color || "#000000");
          path.strokeWidth = drawing.size || 3;
          path.strokeCap = "round";
          path.strokeJoin = "round";
          path.opacity = drawing.opacity || 1;

          drawing.segments.forEach((segment) => {
            if (segment.point && Array.isArray(segment.point)) {
              path.add(
                new paperScope.Point(segment.point[0], segment.point[1])
              );
            }
          });

          if (drawing.closed) {
            path.closePath();
          }

          const pathId = `path-${index}-${Date.now()}`;
          pathsRef.current.set(pathId, path);
        } catch (error) {
          console.error("Error loading drawing:", error);
        }
      });

      paperScope.view.draw();
    }
  }, [paperScope, isInitialized, drawings]);

  // -------- Canvas setup --------
  useEffect(() => {
    if (typeof window !== "undefined") {
      initializePaper();
    }
  }, [initializePaper]);

  // Handle canvas resize after initialization
  useEffect(() => {
    if (!paperScope || !isInitialized) return;

    const handleResize = () => {
      if (canvasRef.current && paperScope) {
        // Save current drawings
        const currentDrawings: Drawing[] = [];
        paperScope.project.activeLayer.children.forEach((item: any) => {
          if (item.className === "Path") {
            const serializedPath: Drawing = {
              segments: item.segments.map((segment: any) => ({
                point: [segment.point.x, segment.point.y] as [number, number],
                handleIn: segment.handleIn
                  ? ([segment.handleIn.x, segment.handleIn.y] as [number, number])
                  : null,
                handleOut: segment.handleOut
                  ? ([segment.handleOut.x, segment.handleOut.y] as [number, number])
                  : null,
              })),
              color: item.strokeColor?.toCSS() || "#000000",
              size: item.strokeWidth || 3,
              opacity: item.opacity || 1,
              closed: item.closed || false,
            };
            currentDrawings.push(serializedPath);
          }
        });

        // Resize canvas
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        paperScope.view.viewSize = new paperScope.Size(rect.width, rect.height);

        // Restore drawings
        currentDrawings.forEach((drawing) => {
          if (drawing && drawing.segments) {
            try {
              const path = new paperScope.Path();
              path.strokeColor = new paperScope.Color(drawing.color || "#000000");
              path.strokeWidth = drawing.size || 3;
              path.strokeCap = "round";
              path.strokeJoin = "round";
              path.opacity = drawing.opacity || 1;

              drawing.segments.forEach((segment) => {
                if (segment.point && Array.isArray(segment.point)) {
                  path.add(
                    new paperScope.Point(segment.point[0], segment.point[1])
                  );
                }
              });

              if (drawing.closed) {
                path.closePath();
              }
            } catch (error) {
              console.error("Error restoring drawing after resize:", error);
            }
          }
        });

        paperScope.view.update();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [paperScope, isInitialized]);

  // Handle mode change - resize canvas when mode changes
  useEffect(() => {
    if (!paperScope || !isInitialized) return;

    const resizeCanvas = () => {
      if (canvasRef.current && paperScope) {
        const rect = canvasRef.current.getBoundingClientRect();

        // Calculate new dimensions based on container
        const newWidth = rect.width;
        const newHeight = rect.height;

        // Only resize if dimensions actually changed
        if (
          canvasRef.current.width !== newWidth ||
          canvasRef.current.height !== newHeight
        ) {
          // Save current drawings before resize
          const currentDrawings: Drawing[] = [];
          paperScope.project.activeLayer.children.forEach((item: any) => {
            if (item.className === "Path") {
              const serializedPath: Drawing = {
                segments: item.segments.map((segment: any) => ({
                  point: [segment.point.x, segment.point.y] as [number, number],
                  handleIn: segment.handleIn
                    ? ([segment.handleIn.x, segment.handleIn.y] as [number, number])
                    : null,
                  handleOut: segment.handleOut
                    ? ([segment.handleOut.x, segment.handleOut.y] as [number, number])
                    : null,
                })),
                color: item.strokeColor?.toCSS() || "#000000",
                size: item.strokeWidth || 3,
                opacity: item.opacity || 1,
                closed: item.closed || false,
              };
              currentDrawings.push(serializedPath);
            }
          });

          // Clear canvas
          paperScope.project.clear();

          // Resize canvas
          canvasRef.current.width = newWidth;
          canvasRef.current.height = newHeight;
          paperScope.view.viewSize = new paperScope.Size(newWidth, newHeight);

          // Restore drawings with scaling
          currentDrawings.forEach((drawing) => {
            if (drawing && drawing.segments) {
              try {
                const path = new paperScope.Path();
                path.strokeColor = new paperScope.Color(drawing.color || "#000000");
                path.strokeWidth = drawing.size || 3;
                path.strokeCap = "round";
                path.strokeJoin = "round";
                path.opacity = drawing.opacity || 1;

                drawing.segments.forEach((segment) => {
                  if (segment.point && Array.isArray(segment.point)) {
                    path.add(
                      new paperScope.Point(segment.point[0], segment.point[1])
                    );
                  }
                });

                if (drawing.closed) {
                  path.closePath();
                }
              } catch (error) {
                console.error(
                  "Error restoring drawing after mode change:",
                  error
                );
              }
            }
          });

          paperScope.view.update();
        }
      }
    };

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(resizeCanvas, 50);
    return () => clearTimeout(timeoutId);
  }, [paperScope, isInitialized, mode]);

  // -------- Socket event handlers --------
  const handleDrawingUpdate = useCallback(
    (data: any) => {
      if (data.userId === (session as any)?.user?.id || localMode) return;

      if (data.drawings && Array.isArray(data.drawings)) {
        setDrawings(data.drawings);
      }
    },
    [(session as any)?.user?.id, localMode, setDrawings]
  );

  const handleClearCanvas = useCallback(() => {
    if (paperScope) {
      paperScope.project.clear();
      pathsRef.current.clear();
      setDrawings([]);
    }
  }, [paperScope, setDrawings]);

  // -------- Socket setup --------
  useEffect(() => {
    if (!socket || localMode || !isLoggedIn) return;

    socket.on("drawing-update", handleDrawingUpdate);
    socket.on("clear-canvas", handleClearCanvas);

    return () => {
      socket.off("drawing-update", handleDrawingUpdate);
      socket.off("clear-canvas", handleClearCanvas);
    };
  }, [socket, localMode, isLoggedIn, handleDrawingUpdate, handleClearCanvas]);

  // -------- Cleanup --------
  useEffect(() => {
    return () => {
      if (paperScope) {
        paperScope.project.clear();
      }
    };
  }, [paperScope]);

  // -------- Render --------
  return (
    <div className={`relative ${className}`} {...props}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{
          touchAction: "none",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

