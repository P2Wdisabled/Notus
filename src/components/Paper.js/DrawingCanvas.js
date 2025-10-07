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

  // new refs to prevent duplicate saves / identify this client
  const clientIdRef = useRef(null);
  const lastSaveAtRef = useRef(0);

  const controllerRef = useRef({
    // provide safe defaults so parent can call immediately
    saveDrawings: async () => { return []; },
    setMode: (mode) => { console.warn('setMode not ready yet', mode); },
    clearCanvas: () => {},
    exportDrawing: () => {},
    forceReload: () => {},
    debugState: () => {},
  });

  // expose controller immediately (so parent gets an object with stable shape)
  useEffect(() => {
    if (typeof onCanvasReady === 'function') {
      onCanvasReady(controllerRef.current);
    }
  }, [onCanvasReady]);

  // ✅ MOVE ALL CALLBACK FUNCTIONS TO THE TOP
  
  // Debug function to check what's in props vs canvas
  const debugState = useCallback(() => {
    console.log('🔍 DEBUG STATE CHECK:');
    console.log('📄 Props drawings:', drawings);
    console.log('📄 Props length:', drawings?.length || 0);
    console.log('🎯 Canvas paths:', paper?.project?.getItems?.({ className: 'Path' })?.length || 0);
    console.log('🏁 Load flags:', {
      hasLoaded: hasLoadedInitialDrawingsRef.current,
      isInitial: isInitialLoadRef.current,
      isIsolated: isIsolatedRef.current
    });
    
    if (paper?.project) {
      const paths = paper.project.getItems({ className: 'Path' });
      console.log('🎨 Canvas paths details:', paths.map(p => ({
        segments: p.segments.length,
        color: p.strokeColor?.toCSS(),
        width: p.strokeWidth
      })));
    }
  }, [drawings, paper]);

  // Cleanup function to remove invalid drawings
  const cleanupInvalidDrawings = useCallback(() => {
    if (!drawings || !Array.isArray(drawings)) return;

    console.log('🧹 CLEANING UP invalid drawings...');
    
    const validDrawings = drawings.filter((drawing, index) => {
      try {
        let pathData = drawing;
        
        // Parse string data
        if (typeof drawing === 'string') {
          try {
            pathData = JSON.parse(drawing);
          } catch (e) {
            console.log(`❌ Drawing ${index + 1}: Invalid JSON`);
            return false;
          }
        }

        // Handle nested data
        if (pathData.drawings && Array.isArray(pathData.drawings)) {
          pathData = pathData.drawings[0];
        }

        // Check if it has valid structure
        const hasValidPoints = pathData.points && Array.isArray(pathData.points) && pathData.points.length > 0;
        const hasValidSegments = pathData.segments && Array.isArray(pathData.segments) && pathData.segments.length > 0;
        
        if (!hasValidPoints && !hasValidSegments) {
          console.log(`❌ Drawing ${index + 1}: No valid points or segments`);
          return false;
        }

        console.log(`✅ Drawing ${index + 1}: Valid`);
        return true;
      } catch (error) {
        console.log(`❌ Drawing ${index + 1}: Error - ${error.message}`);
        return false;
      }
    });

    console.log(`🧹 Cleanup result: ${validDrawings.length}/${drawings.length} drawings are valid`);
    
    if (validDrawings.length !== drawings.length) {
      console.log('🔄 Updating drawings state with only valid drawings...');
      setDrawings(validDrawings);
      return validDrawings.length;
    }
    
    return drawings.length;
  }, [drawings, setDrawings]);

  // Analyze drawing data function
  const analyzeDrawingData = useCallback(() => {
    if (!drawings || !Array.isArray(drawings)) {
      console.log('📊 No drawings to analyze');
      return;
    }

    console.log('📊 ANALYZING DRAWING DATA:');
    console.log(`Total drawings: ${drawings.length}`);
    
    const analysis = {
      validPoints: 0,
      validSegments: 0,
      invalidJSON: 0,
      invalidStructure: 0,
      nested: 0,
      empty: 0
    };

    drawings.slice(0, 20).forEach((drawing, index) => { // Analyze first 20
      try {
        let pathData = drawing;
        
        if (typeof drawing === 'string') {
          try {
            pathData = JSON.parse(drawing);
          } catch (e) {
            analysis.invalidJSON++;
            return;
          }
        }

        if (pathData.drawings && Array.isArray(pathData.drawings)) {
          analysis.nested++;
          pathData = pathData.drawings[0];
        }

        if (!pathData || typeof pathData !== 'object') {
          analysis.invalidStructure++;
          return;
        }

        const hasPoints = pathData.points && Array.isArray(pathData.points) && pathData.points.length > 0;
        const hasSegments = pathData.segments && Array.isArray(pathData.segments) && pathData.segments.length > 0;
        
        if (hasPoints) analysis.validPoints++;
        else if (hasSegments) analysis.validSegments++;
        else analysis.empty++;

      } catch (error) {
        analysis.invalidStructure++;
      }
    });

    console.log('📊 Analysis results (first 20 drawings):', analysis);
    
    // Show samples of each type
    const sampleInvalidJSON = drawings.find(d => typeof d === 'string' && d.includes('{') && !d.startsWith('{'));
    const sampleNested = drawings.find(d => d?.drawings);
    const sampleValid = drawings.find(d => d?.segments || d?.points);
    
    console.log('📄 Sample data:');
    if (sampleInvalidJSON) console.log('Invalid JSON sample:', sampleInvalidJSON);
    if (sampleNested) console.log('Nested sample:', sampleNested);
    if (sampleValid) console.log('Valid sample:', sampleValid);
    
  }, [drawings]);

  // Force reload from props
  const forceReloadFromProps = useCallback(() => {
    console.log('🔄 FORCE RELOADING from props...');
    console.log('🔍 Current state:', {
      paperReady: !!paper?.project,
      drawingsLength: drawings?.length || 0,
      hasLoadedFlag: hasLoadedInitialDrawingsRef.current,
      drawings: drawings
    });
    
    if (paper?.project) {
      hasLoadedInitialDrawingsRef.current = false; // Reset flag
      paper.project.clear();
      console.log('🗑️ Canvas cleared, flag reset');
      
      // Force trigger the loading effect
      setTimeout(() => {
        console.log('🔄 Triggering reload effect...');
      }, 100);
    }
  }, [paper, drawings]);

  // ✅ MODIFY: Save function - avoid no-op saves, include source id, and debounce small bursts
  const saveCurrentDrawings = useCallback(async (opts = {}) => {
    const { force = false } = opts || {};
    if (!paper?.project) return [];
    try {
      const now = Date.now();
      // small debounce to avoid rapid repeated saves (but allow force)
      if (!force && now - (lastSaveAtRef.current || 0) < 300) {
        console.log('⏱️ Skipping save - debounced');
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

      // skip if nothing changed compared to incoming prop to avoid update loops
      try {
        const incomingJSON = JSON.stringify(drawings || []);
        const currentJSON = JSON.stringify(serializedPaths || []);
        if (incomingJSON === currentJSON) {
          console.log('✅ No canvas changes to save (skip set/emit)');
          return serializedPaths;
        }
      } catch (e) {
        // fallback to continue if stringify fails
      }

      // update local state (replace, don't append)
      if (setDrawings) setDrawings(serializedPaths);

      // include a client id so server/other clients can ignore echo
      const source = clientIdRef.current || (socket && socket.id) || `local-${Date.now()}-${Math.random()}`;
      clientIdRef.current = source;

      // emit realtime update (server/other clients can use it for live sync)
      if (socket) {
        try {
          socket.emit('drawings-update', { drawings: serializedPaths, timestamp: Date.now(), source });
        } catch (err) {
          console.warn('socket emit failed', err);
        }
      }

      console.log('saveCurrentDrawings ->', serializedPaths.length);
      return serializedPaths; // always return array
    } catch (err) {
      console.error('saveCurrentDrawings error', err);
      return [];
    }
  }, [paper, setDrawings, socket, drawings]);


  const clearCanvas = useCallback(() => {
    console.log('🧹 Clearing canvas');
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

  const toggleIsolation = useCallback(() => {
    isIsolatedRef.current = !isIsolatedRef.current;
    console.log('🔒 Canvas isolation:', isIsolatedRef.current ? 'ENABLED' : 'DISABLED');
  }, []);

  // make sure setCanvasMode is defined earlier:
  const setCanvasMode = useCallback((mode) => {
    if (mode === 'drawing') {
      isIsolatedRef.current = false;
      console.log('🎨 Canvas set to drawing mode - responsive to input');
    } else if (mode === 'text') {
      isIsolatedRef.current = true;
      console.log('📝 Canvas set to text mode - isolated from drawing input');
    }
  }, []);

  // ✅ NOW ALL THE useEffect HOOKS

    // after functions are defined, keep controllerRef updated
  useEffect(() => {
    controllerRef.current.saveDrawings = saveCurrentDrawings;      // your useCallback
    controllerRef.current.setMode = setCanvasMode;
    controllerRef.current.clearCanvas = clearCanvas;
    controllerRef.current.exportDrawing = exportDrawing;
    controllerRef.current.forceReload = forceReloadFromProps;
    controllerRef.current.debugState = debugState;
  }, [saveCurrentDrawings, setCanvasMode, clearCanvas, exportDrawing, forceReloadFromProps, debugState]);

  // Load paper.js only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPaper = async () => {
      try {
        const paperModule = await import('paper');
        const paperInstance = paperModule.default || paperModule;
        setPaper(paperInstance);
        setIsLoaded(true);
        console.log('✅ Paper.js loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load Paper.js:', error);
      }
    };

    loadPaper();
  }, []);

  // Setup Paper.js once when ready
  useEffect(() => {
    if (!isLoaded || !paper || !canvasRef.current || isSetup) {
      return;
    }

    console.log('🎯 Setting up Paper.js...');
    paper.setup(canvasRef.current);
    setIsSetup(true);
    console.log('✅ Paper.js setup complete');
  }, [isLoaded, paper, isSetup]);

  // Reset the loaded flag when drawings prop changes significantly
  useEffect(() => {
    console.log('🔍 DRAWINGS PROP CHANGED:', {
      length: drawings?.length || 0,
      isArray: Array.isArray(drawings),
      hasData: drawings && drawings.length > 0,
      sample: drawings?.[0],
      timestamp: Date.now()
    });

    // Reset loading flag if we get new drawings data
    if (drawings && Array.isArray(drawings) && drawings.length > 0) {
      const currentCanvasPaths = paper?.project?.getItems?.({ className: 'Path' })?.length || 0;
      
      if (currentCanvasPaths === 0 && hasLoadedInitialDrawingsRef.current) {
        console.log('🔄 RESETTING load flag - we have drawings but empty canvas');
        hasLoadedInitialDrawingsRef.current = false;
      }
    }
  }, [drawings, paper]);

  // Load initial drawings
  useEffect(() => {
    console.log("🎯 Drawing loading effect triggered:", {
      isSetup,
      hasPaper: !!paper,
      hasLoaded: hasLoadedInitialDrawingsRef.current,
      drawingsLength: drawings?.length || 0,
      drawingsType: typeof drawings,
    });

    if (!isSetup || !paper) {
      console.log("⏸️ Skipping - setup not ready");
      return;
    }

    // Allow loading even if hasLoaded is true if canvas is empty
    const currentCanvasPaths = paper.project.getItems({ className: 'Path' }).length;
    const shouldSkipLoading = hasLoadedInitialDrawingsRef.current && currentCanvasPaths > 0;
    
    if (shouldSkipLoading) {
      console.log("⏸️ Skipping - already loaded initial drawings and canvas has paths");
      return;
    }

    console.log("🎯 Attempting to load drawings...", {
      drawingsExists: !!drawings,
      isArray: Array.isArray(drawings),
      length: drawings?.length || 0,
      currentCanvasPaths,
      forceLoad: hasLoadedInitialDrawingsRef.current && currentCanvasPaths === 0
    });

    if (drawings && Array.isArray(drawings) && drawings.length > 0) {
      console.log("📡 Loading INITIAL drawings from props...", drawings.length);

      try {
        paper.project.clear();
        console.log("🗑️ Cleared existing canvas");

        let successCount = 0;

        drawings.forEach((serializedPath, index) => {
          try {
            let pathData = serializedPath;
            
            // Handle different data formats
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
            console.error(`❌ Error processing drawing ${index + 1}:`, pathError);
          }
        });

        paper.view.draw();
        hasLoadedInitialDrawingsRef.current = true;
        
        console.log(`✅ Loaded ${successCount}/${drawings.length} drawings from props`);

        const pathsInProject = paper.project.getItems({ className: "Path" });
        console.log(`🎯 Canvas now has ${pathsInProject.length} paths`);
      } catch (error) {
        console.error("❌ Error loading initial drawings from props:", error);
      }
    } else {
      console.log("📭 No drawings to load, marking as complete");
      hasLoadedInitialDrawingsRef.current = true;
    }
  }, [drawings, isSetup, paper]);

  // Set initial load complete after a delay
  useEffect(() => {
    if (!isSetup || !paper) return;

    const timer = setTimeout(() => {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        console.log('✅ Initial load phase complete - canvas is now responsive');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSetup, paper]);

  // Create/update drawing tool
  useEffect(() => {
    if (!isSetup || !paper) {
      console.log('Paper.js not ready for tool creation');
      return;
    }

    console.log('🖊️ Creating drawing tool - color:', brushColor, 'size:', brushSize);

    if (paper.tools && paper.tools.length > 0) {
      paper.tools.forEach((tool) => tool.remove());
    }

    const tool = new paper.Tool();
    tool.activate();

    tool.onMouseDown = (event) => {
      if (isIsolatedRef.current) {
        console.log('🚫 Drawing blocked - canvas is isolated');
        return;
      }

      console.log('🖊️ Starting drawing');
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

      console.log('🖊️ Finishing drawing');
      isDrawingRef.current = false;

      currentPathRef.current.smooth();
      currentPathRef.current.simplify();
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

      // Save the full canvas to DB (via socket + optional HTTP)
      saveCurrentDrawings().catch(e => console.warn('saveCurrentDrawings failed', e));

      console.log('🖊️ Drawing completed');
    };

    return () => {
      if (paper && paper.tools) {
        paper.tools.forEach((tool) => tool.remove());
      }
    };
  }, [isSetup, paper, brushColor, brushSize, onDrawingData, socket, saveCurrentDrawings]);

  // Socket handlers
  useEffect(() => {
    if (!socket || !paper || !isSetup) return;

    const handleClearCanvas = () => {
      console.log('📨 Received clear canvas command');
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

  // Listen for remote drawing updates but ignore those from this client
  useEffect(() => {
    if (!socket || !setDrawings) return;

    const handleDrawingsUpdate = (payload) => {
      try {
        if (!payload) return;
        if (payload.source && payload.source === clientIdRef.current) {
          // ignore server echo of our own save
          return;
        }
        if (payload.drawings && Array.isArray(payload.drawings)) {
          console.log('📨 Received drawings-update from remote, replacing local drawings');
          setDrawings(payload.drawings);
          // optionally force reload canvas if desired:
          // hasLoadedInitialDrawingsRef.current = false;
        }
      } catch (e) {
        console.warn('handleDrawingsUpdate error', e);
      }
    };

    socket.on('drawings-update', handleDrawingsUpdate);
    return () => {
      socket.off('drawings-update', handleDrawingsUpdate);
    };
  }, [socket, setDrawings]);

  // Handle resize
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
