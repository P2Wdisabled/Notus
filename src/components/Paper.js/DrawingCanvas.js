"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/lib/paper.js/socket";
import { useLocalSession } from "@/hooks/useLocalSession";

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
}) {
  // -------- State management --------
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [paperScope, setPaperScope] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const paperRef = useRef(null);
  const clientIdRef = useRef(null);
  const pathsRef = useRef(new Map());
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef(null);
  const modeRef = useRef(mode);

  // Session
  const { session, isLoggedIn } = useLocalSession();

  // Socket
  const { socket, localMode } = useSocket();

  // -------- Drawing state --------
  const [localDrawingState, setLocalDrawingState] = useState({
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

    const allPaths = [];
    paperScope.project.activeLayer.children.forEach((item) => {
      if (item.className === "Path") {
        const serializedPath = {
          segments: item.segments.map((segment) => ({
            point: [segment.point.x, segment.point.y],
            handleIn: segment.handleIn
              ? [segment.handleIn.x, segment.handleIn.y]
              : null,
            handleOut: segment.handleOut
              ? [segment.handleOut.x, segment.handleOut.y]
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

    console.log("Initializing Paper.js with mode:", mode);
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
      paper.view.setViewSize(new paper.Size(rect.width, rect.height));

      // Set up drawing tools
      const tool = new paper.Tool();

      tool.onMouseDown = (event) => {
        console.log("Mouse down - mode:", modeRef.current, "event:", event);
        if (modeRef.current !== "draw") {
          console.log("Mode is not draw, returning");
          return;
        }

        console.log("Starting to draw");
        setIsDrawing(true);
        isDrawingRef.current = true;

        const path = new paper.Path();
        path.strokeColor = drawingState.color;
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

      tool.onMouseDrag = (event) => {
        console.log(
          "Mouse drag - isDrawing:",
          isDrawingRef.current,
          "currentPath:",
          !!currentPathRef.current,
          "mode:",
          modeRef.current
        );
        if (
          !isDrawingRef.current ||
          !currentPathRef.current ||
          modeRef.current !== "draw"
        ) {
          console.log("Not drawing, returning");
          return;
        }

        console.log("Adding point to path:", event.point);
        currentPathRef.current.add(event.point);
        paper.view.draw();
      };

      tool.onMouseUp = (event) => {
        console.log(
          "Mouse up - isDrawing:",
          isDrawingRef.current,
          "currentPath:",
          !!currentPathRef.current,
          "mode:",
          modeRef.current
        );
        if (
          !isDrawingRef.current ||
          !currentPathRef.current ||
          modeRef.current !== "draw"
        ) {
          console.log("Not finishing draw, returning");
          return;
        }

        console.log("Finishing draw");
        setIsDrawing(false);
        isDrawingRef.current = false;

        // Finalize path
        currentPathRef.current.simplify(2);

        // Convert to serializable format
        const serializedPath = {
          segments: currentPathRef.current.segments.map((segment) => ({
            point: [segment.point.x, segment.point.y],
            handleIn: segment.handleIn
              ? [segment.handleIn.x, segment.handleIn.y]
              : null,
            handleOut: segment.handleOut
              ? [segment.handleOut.x, segment.handleOut.y]
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
        paper.view.draw();

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
            const allPaths = [];
            paper.project.activeLayer.children.forEach((item, index) => {
              if (item.className === "Path") {
                const serializedPath = {
                  segments: item.segments.map((segment) => ({
                    point: [segment.point.x, segment.point.y],
                    handleIn: segment.handleIn
                      ? [segment.handleIn.x, segment.handleIn.y]
                      : null,
                    handleOut: segment.handleOut
                      ? [segment.handleOut.x, segment.handleOut.y]
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
          setDrawingState: (newState) => {
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
          path.strokeColor = drawing.color || "#000000";
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
        const currentDrawings = [];
        paperScope.project.activeLayer.children.forEach((item) => {
          if (item.className === "Path") {
            const serializedPath = {
              segments: item.segments.map((segment) => ({
                point: [segment.point.x, segment.point.y],
                handleIn: segment.handleIn
                  ? [segment.handleIn.x, segment.handleIn.y]
                  : null,
                handleOut: segment.handleOut
                  ? [segment.handleOut.x, segment.handleOut.y]
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
        paperScope.view.setViewSize(
          new paperScope.Size(rect.width, rect.height)
        );

        // Restore drawings
        currentDrawings.forEach((drawing) => {
          if (drawing && drawing.segments) {
            try {
              const path = new paperScope.Path();
              path.strokeColor = drawing.color || "#000000";
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

        paperScope.view.draw();
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
          const currentDrawings = [];
          paperScope.project.activeLayer.children.forEach((item) => {
            if (item.className === "Path") {
              const serializedPath = {
                segments: item.segments.map((segment) => ({
                  point: [segment.point.x, segment.point.y],
                  handleIn: segment.handleIn
                    ? [segment.handleIn.x, segment.handleIn.y]
                    : null,
                  handleOut: segment.handleOut
                    ? [segment.handleOut.x, segment.handleOut.y]
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
          paperScope.view.setViewSize(new paperScope.Size(newWidth, newHeight));

          // Restore drawings with scaling
          currentDrawings.forEach((drawing) => {
            if (drawing && drawing.segments) {
              try {
                const path = new paperScope.Path();
                path.strokeColor = drawing.color || "#000000";
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

          paperScope.view.draw();
        }
      }
    };

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(resizeCanvas, 50);
    return () => clearTimeout(timeoutId);
  }, [paperScope, isInitialized, mode]);

  // -------- Socket event handlers --------
  const handleDrawingUpdate = useCallback(
    (data) => {
      if (data.userId === session?.user?.id || localMode) return;

      if (data.drawings && Array.isArray(data.drawings)) {
        setDrawings(data.drawings);
      }
    },
    [session?.user?.id, localMode, setDrawings]
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
