'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getLocalStorageData, saveDrawingsToLocalStorage } from '../../lib/paper.js/localStorage';
import { debounce } from '../../lib/paper.js/debounce';

export default function DrawingCanvas({ 
  brushColor, 
  brushSize, 
  onDrawingData, 
  socket 
}) {
  const canvasRef = useRef(null);
  const [paper, setPaper] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentPathRef = useRef(null);
  const isDrawingRef = useRef(false);

  const loadFromLocalStorage = useCallback(() => {
    try {
      console.log('loadFromLocalStorage called');
      console.log('- paper ready:', !!paper);
      console.log('- project ready:', !!paper?.project);
      console.log('- activeLayer ready:', !!paper?.project?.activeLayer);
      console.log('- view ready:', !!paper?.view);
      
      if (!paper || !paper.project || !paper.project.activeLayer || !paper.view) {
        console.log('Paper not fully ready, skipping load');
        return;
      }

      const data = getLocalStorageData();
      console.log('Loading drawings from localStorage:', data.drawings.length, 'drawings found');
      
      // Load drawings
      if (data.drawings && data.drawings.length > 0) {
        // Clear existing drawings first
        console.log('Clearing existing drawings...');
        paper.project.clear();
        
        console.log('Loading saved drawings...');
        data.drawings.forEach((serializedPath, index) => {
          const isLegacyFormat = 'points' in serializedPath;
          console.log(`Loading drawing ${index + 1}:`, {
            segmentsCount: isLegacyFormat ? serializedPath.points.length : serializedPath.segments.length,
            color: serializedPath.color,
            size: serializedPath.size,
            format: isLegacyFormat ? 'legacy' : 'new'
          });
          
          const path = new paper.Path({
            strokeColor: new paper.Color(serializedPath.color),
            strokeWidth: serializedPath.size,
            strokeCap: 'round',
            strokeJoin: 'round',
            closed: isLegacyFormat ? false : serializedPath.closed || false
          });
          
          if (isLegacyFormat) {
            // Old format compatibility - convert points to segments
            serializedPath.points.forEach((point) => {
              path.add(new paper.Point(point[0], point[1]));
            });
          } else {
            // New format with curve data
            serializedPath.segments.forEach(segment => {
              const point = new paper.Point(segment.point[0], segment.point[1]);
              const paperSegment = new paper.Segment(point);
              
              if (segment.handleIn) {
                paperSegment.handleIn = new paper.Point(segment.handleIn[0], segment.handleIn[1]);
              }
              if (segment.handleOut) {
                paperSegment.handleOut = new paper.Point(segment.handleOut[0], segment.handleOut[1]);
              }
              
              path.add(paperSegment);
            });
          }
          
          console.log(`Created path with ${path.segments.length} segments`);
        });
        
        console.log('Forcing canvas redraw...');
        paper.view.draw();
        
        // Double check what's in the project now
        const pathsInProject = paper.project.getItems({ className: 'Path' });
        console.log('Paths now in project:', pathsInProject.length);
        
        console.log('Successfully loaded', data.drawings.length, 'drawings and redrawn canvas');
      } else {
        console.log('No drawings to load');
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, [paper]);

  const saveToLocalStorage = useCallback(() => {
    if (!paper || !paper.project) return;

    try {
      const paths = paper.project.getItems({ className: 'Path' });
      console.log('Saving drawings to localStorage, found paths:', paths.length);
      
      const serializedPaths = paths.map((path) => ({
        segments: path.segments.map((segment) => ({
          point: [segment.point.x, segment.point.y],
          handleIn: segment.handleIn ? [segment.handleIn.x, segment.handleIn.y] : undefined,
          handleOut: segment.handleOut ? [segment.handleOut.x, segment.handleOut.y] : undefined
        })),
        color: path.strokeColor.toCSS(true),
        size: path.strokeWidth,
        type: 'pen',
        closed: path.closed || false
      }));

      const success = saveDrawingsToLocalStorage(serializedPaths);
      if (success) {
        console.log('Successfully saved', serializedPaths.length, 'drawings with curve data');
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [paper]);

  // Debounced save for frequent operations
  const debouncedSave = useCallback(
    debounce(saveToLocalStorage, 500), // Save after 500ms of inactivity
    [saveToLocalStorage]
  );

  const [isSetup, setIsSetup] = useState(false);

  // Load paper.js only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPaper = async () => {
      try {
        const paperModule = await import('paper');
        const paperInstance = paperModule.default || paperModule;
        setPaper(paperInstance);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load Paper.js:', error);
      }
    };

    loadPaper();
  }, []);

  // Setup Paper.js once when ready
  useEffect(() => {
    if (!isLoaded || !paper || !canvasRef.current || isSetup) {
      return;
    }

    console.log('Setting up Paper.js for the first time...');
    paper.setup(canvasRef.current);
    setIsSetup(true);
    
    console.log('Paper.js setup complete');
    console.log('- project:', !!paper.project);
    console.log('- activeLayer:', !!paper.project?.activeLayer);
    console.log('- view:', !!paper.view);

    // Load drawings after setup
    setTimeout(() => {
      console.log('Loading drawings after Paper.js setup...');
      loadFromLocalStorage();
    }, 100);
  }, [isLoaded, paper, isSetup, loadFromLocalStorage]);

  // Create/update drawing tool when brush settings change
  useEffect(() => {
    if (!isSetup || !paper) {
      console.log('Paper.js not ready for tool creation');
      return;
    }

    console.log('Creating drawing tool with brush settings - color:', brushColor, 'size:', brushSize);

    // Remove existing tools to prevent conflicts
    if (paper.tools && paper.tools.length > 0) {
      console.log('Removing', paper.tools.length, 'existing tools');
      paper.tools.forEach((tool) => tool.remove());
    }
    
    // Create new tool with current brush settings
    const tool = new paper.Tool();
    tool.activate();
    console.log('Tool created and activated');

    tool.onMouseDown = (event) => {
      console.log('Mouse down detected - starting drawing');
      isDrawingRef.current = true;
      currentPathRef.current = new paper.Path({
        segments: [event.point],
        strokeColor: new paper.Color(brushColor),
        strokeWidth: brushSize,
        strokeCap: 'round',
        strokeJoin: 'round'
      });

      if (onDrawingData) {
        onDrawingData({
          type: 'start',
          point: event.point,
          color: brushColor,
          size: brushSize
        });
      }
    };

    tool.onMouseDrag = (event) => {
      if (!isDrawingRef.current || !currentPathRef.current) return;
      
      currentPathRef.current.add(event.point);

      if (onDrawingData) {
        onDrawingData({
          type: 'draw',
          point: event.point,
          color: brushColor,
          size: brushSize
        });
      }

      // Auto-save while drawing (debounced)
      debouncedSave();
    };

    tool.onMouseUp = (event) => {
      if (!isDrawingRef.current || !currentPathRef.current) return;
      
      isDrawingRef.current = false;
      
      // Smooth the path first to create nice curves
      currentPathRef.current.smooth();
      
      // Then simplify to reduce points while preserving curves
      currentPathRef.current.simplify();

      if (onDrawingData) {
        onDrawingData({
          type: 'end',
          point: event.point
        });
      }

      // Save on mouse up
      saveToLocalStorage();
      console.log('Drawing stroke completed, smoothed, and saved');
    };

    // Handle socket events
    if (socket) {
      const handleIncomingDrawing = (data) => {
        if (data.type === 'start' && data.point) {
          const remotePath = new paper.Path({
            strokeColor: new paper.Color(data.color || '#000000'),
            strokeWidth: data.size || 3,
            strokeCap: 'round',
            strokeJoin: 'round'
          });
          remotePath.add(data.point);
          remotePath.data = { isRemote: true };
        } else if (data.type === 'draw' && data.point) {
          const paths = paper.project.getItems({ 
            className: 'Path'
          }).filter((item) => 
            item.data?.isRemote === true
          );
          
          if (paths.length > 0) {
            const lastPath = paths[paths.length - 1];
            lastPath.add(data.point);
          }
        }
        saveToLocalStorage(); // Save remote changes too
      };

      socket.on('drawing-data', handleIncomingDrawing);
      
      return () => {
        socket.off('drawing-data', handleIncomingDrawing);
      };
    }

    // Cleanup function for tool creation
    return () => {
      if (paper && paper.tools) {
        paper.tools.forEach((tool) => tool.remove());
      }
    };
  }, [isSetup, paper, brushColor, brushSize, onDrawingData, socket, saveToLocalStorage, debouncedSave]);

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

  const clearCanvas = useCallback(() => {
    if (paper?.project) {
      paper.project.clear();
      saveToLocalStorage(); // Save empty state
    }
    if (socket) {
      socket.emit('clear-canvas');
    }
  }, [paper, socket, saveToLocalStorage]);

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

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white"
        style={{ touchAction: 'none' }}
      />
      
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={loadFromLocalStorage}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Reload Drawings
        </button>
        <button
          onClick={clearCanvas}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
        >
          Clear Canvas
        </button>
        <button
          onClick={exportDrawing}
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors text-sm"
        >
          Export SVG
        </button>
        <button
          onClick={saveToLocalStorage}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Save Now
        </button>
      </div>
    </div>
  );
}