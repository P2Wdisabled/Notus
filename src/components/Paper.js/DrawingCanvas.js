'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export default function DrawingCanvas(props) {
  const {
    brushColor = '#000000',
    brushSize = 3,
    onDrawingData,
    socket,
    drawings = [],
    setDrawings,
    onCanvasReady,
  } = props;

  const canvasRef = useRef(null);
  const [paper, setPaper] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentPathRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [isSetup, setIsSetup] = useState(false);
  const isInitialLoadRef = useRef(true);
  const isIsolatedRef = useRef(false);
  const hasLoadedInitialDrawingsRef = useRef(false);

  const clientIdRef = useRef(null);
  const lastSaveAtRef = useRef(0);

  const controllerRef = useRef({
    saveDrawings: async () => { return []; },
    setMode: (mode) => {},
    clearCanvas: () => {},
    exportDrawing: () => {},
    forceReload: () => {},
    debugState: () => {},
    renderTextFromHTML: async () => {},
    clearTextOverlay: () => {},
  });

  const textRasterRef = useRef(null);

  useEffect(() => {
    if (typeof onCanvasReady === 'function') {
      try { onCanvasReady({ ...controllerRef.current }); } catch (e) {}
    }
  }, [onCanvasReady]);

  const saveCurrentDrawings = useCallback(async (opts = {}) => {
    const { force = false } = opts || {};
    if (!paper?.project) return [];
    try {
      const now = Date.now();
      if (!force && now - (lastSaveAtRef.current || 0) < 300) {
        return [];
      }
      lastSaveAtRef.current = now;

      const paths = paper.project.getItems({ className: 'Path' });
      const serializedPaths = paths.map(path => ({
        segments: path.segments.map(s => ({
          point: [s.point.x, s.point.y],
          handleIn: s.handleIn ? [s.handleIn.x, s.handleIn.y] : null,
          handleOut: s.handleOut ? [s.handleOut.x, s.handleOut.y] : null
        })),
        color: path.strokeColor ? path.strokeColor.toCSS(true) : '#000000',
        size: path.strokeWidth || 3,
        type: 'pen',
        closed: !!path.closed,
      }));

      try {
        const incomingJSON = JSON.stringify(drawings || []);
        const currentJSON = JSON.stringify(serializedPaths || []);
        if (incomingJSON === currentJSON) {
          return serializedPaths;
        }
      } catch (e) {
      }

      if (setDrawings) setDrawings(serializedPaths);

      const source = clientIdRef.current || (socket && socket.id) || `local-${Date.now()}-${Math.random()}`;
      clientIdRef.current = source;

      if (socket) {
        try {
          socket.emit('drawings-update', { drawings: serializedPaths, timestamp: Date.now(), source });
        } catch (err) {
        }  
      }

      return serializedPaths;
    } catch (err) {
      return [];
    }
  }, [paper, setDrawings, socket, drawings]);


  const clearCanvas = useCallback(() => {
    if (paper?.project) {
      paper.project.clear();
      paper.view.draw();
      hasLoadedInitialDrawingsRef.current = false;
      if (setDrawings) setDrawings([]);
    }
    if (socket) {
      socket.emit('clear-canvas');
    }
  }, [paper, socket, setDrawings]);

  const exportDrawing = useCallback(() => {
    if (paper?.project) {
      const dataUrl = paper.project.exportSVG({ asString: true });
      const blob = new Blob([dataUrl], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drawing-${new Date().toISOString().split('T')[0]}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [paper]);

  const setCanvasMode = useCallback((mode) => {
    if (mode === 'drawing') {
      isIsolatedRef.current = false;
    } else if (mode === 'text') {
      isIsolatedRef.current = true;
    }
  }, []);

  useEffect(() => {
    controllerRef.current.saveDrawings = saveCurrentDrawings;
    controllerRef.current.setMode = setCanvasMode;
    controllerRef.current.clearCanvas = clearCanvas;
    controllerRef.current.exportDrawing = exportDrawing;
    controllerRef.current.renderTextFromHTML = async (html, formatting = {}) => {
      if (!paper || !canvasRef.current) return;
      try {
        // remove existing text raster
        if (textRasterRef.current) {
          try { textRasterRef.current.remove(); } catch (e) {}
          textRasterRef.current = null;
        }

        const width = canvasRef.current.offsetWidth || canvasRef.current.width || 800;
        const height = canvasRef.current.offsetHeight || canvasRef.current.height || 600;

  const fontFamily = formatting.fontFamily || 'Inter, sans-serif';
  const fontSize = formatting.fontSize || 16;
  const color = formatting.color || '#000000';
  const backgroundColor = formatting.backgroundColor || 'transparent';
  const padding = formatting.padding || '0px 0px 0px 0px';

  // Wrap HTML in a foreignObject-enabled SVG. Ensure width/height inline styles so layout matches.
  const safeHtml = html || '';
  // include padding to match editor spacing
  const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>\n  <foreignObject width='100%' height='100%'>\n    <div xmlns='http://www.w3.org/1999/xhtml' style="box-sizing:border-box; width:${width}px; height:${height}px; padding:${padding}; background:${backgroundColor}; color:${color}; font-family:${fontFamily}; font-size:${fontSize}px; white-space:pre-wrap;">${safeHtml}</div>\n  </foreignObject>\n</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            const raster = new paper.Raster(img);
            // position raster centered
            raster.position = new paper.Point(width / 2, height / 2);
            raster.locked = true;
            raster.name = 'textOverlayRaster';
            // put raster at the back so drawings appear above
            try { raster.sendToBack(); } catch (e) {}
            textRasterRef.current = raster;
            paper.view.draw();
          } catch (e) {}
          URL.revokeObjectURL(url);
        };
        img.onerror = () => { URL.revokeObjectURL(url); };
        img.src = url;
      } catch (e) {
      }
    };

    controllerRef.current.clearTextOverlay = () => {
      try {
        if (textRasterRef.current) {
          try { textRasterRef.current.remove(); } catch (e) {}
          textRasterRef.current = null;
          paper.view.draw();
        }
      } catch (e) {}
    };
    // Ensure parent receives the updated controller with render/clear methods
    if (typeof onCanvasReady === 'function') {
      try { onCanvasReady({ ...controllerRef.current }); } catch (e) {}
    }
  }, [saveCurrentDrawings, setCanvasMode, clearCanvas, exportDrawing]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPaper = async () => {
      try {
        const paperModule = await import('paper');
        const paperInstance = paperModule.default || paperModule;
        setPaper(paperInstance);
        setIsLoaded(true);
      } catch (error) {

      }
    };

    loadPaper();
  }, []);

  useEffect(() => {
    if (!isLoaded || !paper || !canvasRef.current || isSetup) {
      return;
    }

    paper.setup(canvasRef.current);
    setIsSetup(true);
  }, [isLoaded, paper, isSetup]);

  useEffect(() => {
    if (drawings && Array.isArray(drawings) && drawings.length > 0) {
      const currentCanvasPaths = paper?.project?.getItems?.({ className: 'Path' })?.length || 0;
      if (currentCanvasPaths === 0 && hasLoadedInitialDrawingsRef.current) {
        hasLoadedInitialDrawingsRef.current = false;
      }
    }
  }, [drawings, paper]);

  useEffect(() => {
    if (!isSetup || !paper) {
      return;
    }

    const currentCanvasPaths = paper.project.getItems({ className: 'Path' }).length;
    const shouldSkipLoading = hasLoadedInitialDrawingsRef.current && currentCanvasPaths > 0;
    
    if (shouldSkipLoading) {
      return;
    }

    if (drawings && Array.isArray(drawings) && drawings.length > 0) {
      try {
        paper.project.clear();

        let successCount = 0;

        drawings.forEach((serializedPath) => {
          try {
            let pathData = serializedPath;
            
            if (typeof serializedPath === 'string') {
              try {
                pathData = JSON.parse(serializedPath);
              } catch (e) {
                return;
              }
            }

            if (pathData.drawings && Array.isArray(pathData.drawings)) {
              pathData = pathData.drawings[0];
            }

            if (!pathData || typeof pathData !== 'object') {
              return;
            }

            const isLegacyFormat = "points" in pathData;
            const hasSegments = "segments" in pathData;

            const path = new paper.Path({
              strokeColor: new paper.Color(pathData.color || "#000000"),
              strokeWidth: pathData.size || 3,
              strokeCap: "round",
              strokeJoin: "round",
              closed: isLegacyFormat ? false : pathData.closed || false,
            });

            let pointsAdded = 0;

            if (isLegacyFormat && pathData.points && Array.isArray(pathData.points)) {
              pathData.points.forEach((point) => {
                if (point && Array.isArray(point) && point.length >= 2) {
                  path.add(new paper.Point(point[0], point[1]));
                  pointsAdded++;
                }
              });
            } else if (hasSegments && pathData.segments && Array.isArray(pathData.segments)) {
              pathData.segments.forEach((segment) => {
                if (
                  segment.point &&
                  Array.isArray(segment.point) &&
                  segment.point.length >= 2
                ) {
                  const point = new paper.Point(
                    segment.point[0],
                    segment.point[1]
                  );
                  const paperSegment = new paper.Segment(point);

                  if (segment.handleIn && Array.isArray(segment.handleIn)) {
                    paperSegment.handleIn = new paper.Point(
                      segment.handleIn[0],
                      segment.handleIn[1]
                    );
                  }
                  if (segment.handleOut && Array.isArray(segment.handleOut)) {
                    paperSegment.handleOut = new paper.Point(
                      segment.handleOut[0],
                      segment.handleOut[1]
                    );
                  }

                  path.add(paperSegment);
                  pointsAdded++;
                }
              });
            } else {
              path.remove();
              return;
            }

            if (pointsAdded > 0) {
              successCount++;
            } else {
              path.remove();
            }
          } catch (pathError) {
          }
        });

        paper.view.draw();
        hasLoadedInitialDrawingsRef.current = true;

      } catch (error) {
      }
    } else {
      hasLoadedInitialDrawingsRef.current = true;
    }
  }, [drawings, isSetup, paper]);

  useEffect(() => {
    if (!isSetup || !paper) return;

    const timer = setTimeout(() => {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSetup, paper]);

  useEffect(() => {
    if (!isSetup || !paper) {
      return;
    }

    if (paper.tools && paper.tools.length > 0) {
      paper.tools.forEach((tool) => tool.remove());
    }

    const tool = new paper.Tool();
    tool.activate();

    tool.onMouseDown = (event) => {
      if (isIsolatedRef.current) return;

      isDrawingRef.current = true;

      currentPathRef.current = new paper.Path({
        segments: [event.point],
        strokeColor: new paper.Color(brushColor),
        strokeWidth: brushSize,
        strokeCap: 'round',
        strokeJoin: 'round',
      });

      paper.view.draw();

      if (onDrawingData) {
        onDrawingData({
          type: 'start',
          point: event.point,
          color: brushColor,
          size: brushSize,
        });
      }

      if (socket) {
        socket.emit('drawing-data', {
          type: 'start',
          point: { x: event.point.x, y: event.point.y },
          color: brushColor,
          size: brushSize,
        });
      }
    };

    tool.onMouseDrag = (event) => {
      if (!isDrawingRef.current || !currentPathRef.current || isIsolatedRef.current)
        return;

      currentPathRef.current.add(event.point);
      paper.view.draw();

      if (onDrawingData) {
        onDrawingData({
          type: 'draw',
          point: event.point,
          color: brushColor,
          size: brushSize,
        });
      }

      if (socket) {
        socket.emit('drawing-data', {
          type: 'draw',
          point: { x: event.point.x, y: event.point.y },
          color: brushColor,
          size: brushSize,
        });
      }
    };

    tool.onMouseUp = (event) => {
      if (!isDrawingRef.current || !currentPathRef.current || isIsolatedRef.current)
        return;

      isDrawingRef.current = false;

  // Only smooth the path to generate proper bezier handles.
  // Avoid simplify() here because it can remove control points/handles
  // which makes curves render as pointy on reload.
  try {
    // prefer 'continuous' smoothing when available
    if (typeof currentPathRef.current.smooth === 'function') {
      try { currentPathRef.current.smooth('continuous'); }
      catch { currentPathRef.current.smooth(); }
    }
  } catch (e) {
    try { currentPathRef.current.smooth(); } catch (e) {}
  }
      paper.view.draw();

      if (onDrawingData) {
        onDrawingData({
          type: 'end',
          point: event.point,
        });
      }

      if (socket) {
        socket.emit('drawing-data', {
          type: 'end',
          point: { x: event.point.x, y: event.point.y },
        });
      }

      saveCurrentDrawings().catch(() => {});
    };

    return () => {
      if (paper && paper.tools) {
        paper.tools.forEach((tool) => tool.remove());
      }
    };
  }, [isSetup, paper, brushColor, brushSize, onDrawingData, socket, saveCurrentDrawings]);

  useEffect(() => {
    if (!socket || !paper || !isSetup) return;

    const handleClearCanvas = () => {
      if (paper?.project) {
        paper.project.clear();
        paper.view.draw();
        hasLoadedInitialDrawingsRef.current = false;
        if (setDrawings) {
          setDrawings([]);
        }
      }
    };

    socket.on('clear-canvas', handleClearCanvas);
    
    return () => {
      socket.off('clear-canvas', handleClearCanvas);
    };
  }, [socket, paper, isSetup, setDrawings]);

  useEffect(() => {
    if (!socket || !setDrawings) return;

    const handleDrawingsUpdate = (payload) => {
      try {
        if (!payload) return;
        if (payload.source && payload.source === clientIdRef.current) {
          return;
        }
        if (payload.drawings && Array.isArray(payload.drawings)) {
          setDrawings(payload.drawings);
        }
      } catch (e) {
      }
    };

    socket.on('drawings-update', handleDrawingsUpdate);
    return () => {
      socket.off('drawings-update', handleDrawingsUpdate);
    };
  }, [socket, setDrawings]);

  useEffect(() => {
    if (!paper || !canvasRef.current) return;

    const handleResize = () => {
      if (canvasRef.current && paper.view) {
        paper.view.viewSize = new paper.Size(
          canvasRef.current.offsetWidth,
          canvasRef.current.offsetHeight
        );
        paper.view.draw();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [paper]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}