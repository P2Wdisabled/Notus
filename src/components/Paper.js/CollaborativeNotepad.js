'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import RichTextEditor from './RichTextEditor';
import Toolbar from './Toolbar/Toolbar.js';
import { useSocket } from '../../lib/paper.js/socket';
import { getSettings, saveSettings, clearLocalStorageData, getLocalStorageData, saveTextFormattingToLocalStorage } from '../../lib/paper.js/localStorage';

const DrawingCanvas = dynamic(() => import('./DrawingCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="text-gray-500">Loading drawing canvas...</div>
    </div>
  )
});

export default function CollaborativeNotepad({ 
  roomId = 'default-room',
  documentId,
  userId,
  initialData,
  onContentChange,
  onCanvasReady,
  useLocalStorage = true,
  localStorageKey,
  localMode = false,
  placeholder = 'Start typing...',
  className = '',
  initialContent = ''
}) {
  // choose a stable storage key per document
  const storageKey = useLocalStorage
    ? (localStorageKey ?? `collab-notepad-${initialData?.id ?? 'unsaved'}`)
    : null;

  const [mode, setMode] = useState('draw');
  const [useRichText, setUseRichText] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [content, setContent] = useState('');
  const [drawings, setDrawings] = useState([]); // NEW: Track drawings
  const [textFormatting, setTextFormatting] = useState({
    color: '#000000',
    backgroundColor: 'transparent',
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'normal',
    textAlign: 'left'
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [canvasControls, setCanvasControls] = useState(null);

  const { socket, isConnected } = useSocket(localMode ? null : roomId);

  // ✅ FIXED: Load data from database first, then localStorage as fallback
  useEffect(() => {
    if (isInitialized) return;

    console.log('🔄 Initializing CollaborativeNotepad...', {
      documentId,
      hasInitialData: !!initialData,
      useLocalStorage,
      localMode
    });

    // Priority 1: Database data (for editing existing documents)
    if (initialData) {
      console.log('📊 Loading from database:', initialData);
      
      // Parse database content
      let dbTextContent = '';
      let dbDrawings = [];
      let dbTextFormatting = {};
      
      try {
        // ✅ Always prefer initialData.text
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
            : JSON.parse(initialData.drawings_data || '[]');
        }

        if (initialData.textFormatting) {
          dbTextFormatting = initialData.textFormatting;
        } else if (initialData.text_formatting) {
          dbTextFormatting = typeof initialData.text_formatting === 'object'
            ? initialData.text_formatting
            : JSON.parse(initialData.text_formatting || '{}');
        }
      } catch (error) {
        console.warn('⚠️ Error parsing database content:', error);
        dbTextContent = initialData.text ?? initialData.content ?? '';
      }
      
      setContent(dbTextContent);
      setDrawings(dbDrawings);
      setTextFormatting(prev => ({ ...prev, ...dbTextFormatting }));
      
      console.log('✅ Database data loaded');
    }
    
    // Priority 2: localStorage (only for new documents)
    else if (useLocalStorage && !documentId) {
      console.log('💾 Loading from localStorage...');
      
      const savedSettings = getSettings();
      if (savedSettings) {
        setMode(savedSettings.mode || 'draw');
        setBrushColor(savedSettings.brushColor || '#000000');
        setBrushSize(savedSettings.brushSize || 3);
      }
      
      const savedData = getLocalStorageData();
      if (savedData.textFormatting) {
        setTextFormatting(prev => ({ ...prev, ...savedData.textFormatting }));
      }
      
      if (savedData.text) {
        setContent(savedData.text);
      } else if (initialContent) {
        setContent(initialContent);
      }
      
      if (savedData.drawings) {
        setDrawings(savedData.drawings);
      }
      
      console.log('✅ localStorage data loaded');
    }
    
    // Priority 3: Initial content prop
    else if (initialContent) {
      console.log('📝 Using initial content prop');
      setContent(initialContent);
    }
    
    // Priority 4: Default settings only
    else {
      console.log('🆕 Starting with default settings');
      const savedSettings = getSettings();
      if (savedSettings) {
        setMode(savedSettings.mode || 'draw');
        setBrushColor(savedSettings.brushColor || '#000000');
        setBrushSize(savedSettings.brushSize || 3);
      }
    }

    setIsInitialized(true);
  }, [initialData, useLocalStorage, documentId, initialContent, isInitialized]);

  // ✅ FIXED: Only save to localStorage for new documents
  useEffect(() => {
    if (!isInitialized) return;
    
    if (useLocalStorage && !documentId) {
      const settings = {
        mode,
        brushColor,
        brushSize,
        lastUpdated: Date.now()
      };
      saveSettings(settings);
    }
  }, [mode, brushColor, brushSize, useLocalStorage, documentId, isInitialized]);

  // Join document room when socket connects
  useEffect(() => {
    if (socket && documentId && !localMode) {
      console.log('🔌 Joining document room:', documentId);
      socket.emit('join-document', documentId);
    }
  }, [socket, documentId, localMode]);

  // Handle incoming collaboration events
  useEffect(() => {
    if (!socket || localMode) return;

    const handleDocumentState = (data) => {
      console.log('📨 Received document state:', data);
      if (!isInitialized) return;
      
      setContent(data.content || '');
      setDrawings(data.drawings || []);
      if (data.textFormatting) {
        setTextFormatting(prev => ({ ...prev, ...data.textFormatting }));
      }
    };

    const handleDrawingData = (data) => {
      console.log('✏️ Received drawing data:', data);
      setDrawings(prev => [...prev, data.drawingData]);
    };

    const handleTextUpdate = (data) => {
      console.log('📝 Received text update');
      setContent(data.content);
    };

    const handleTextFormattingUpdate = (data) => {
      console.log('🎨 Received formatting update');
      setTextFormatting(prev => ({ ...prev, ...data.formatting }));
      if (useLocalStorage && !documentId) {
        saveTextFormattingToLocalStorage(data.formatting);
      }
    };

    const handleClearCanvas = () => {
      console.log('🗑️ Clear canvas received');
      setContent('');
      setDrawings([]);
    };

    socket.on('document-state', handleDocumentState);
    socket.on('drawing-data', handleDrawingData);
    socket.on('text-update', handleTextUpdate);
    socket.on('text-formatting-update', handleTextFormattingUpdate);
    socket.on('clear-canvas', handleClearCanvas);

    return () => {
      socket.off('document-state', handleDocumentState);
      socket.off('drawing-data', handleDrawingData);
      socket.off('text-update', handleTextUpdate);
      socket.off('text-formatting-update', handleTextFormattingUpdate);
      socket.off('clear-canvas', handleClearCanvas);
    };
  }, [socket, localMode, isInitialized, useLocalStorage, documentId]);

  const handleDrawingData = (data) => {
    setDrawings(prev => [...prev, data]);
    
    // Send to database via socket (only for existing documents)
    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit('drawing-data', {
        documentId,
        userId,
        drawingData: data
      });
    }
  };

  const handleTextChange = (newContent) => {
    setContent(newContent);
    
    // Send to database via socket (only for existing documents)
    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit('text-update', {
        documentId,
        userId,
        content: newContent
      });
    }
    
    // Call parent callback for form submission
    if (onContentChange) {
      handleContentChangeCallback();
    }
  };

  const handleTextFormattingChange = (formatting) => {
    const newFormatting = { ...textFormatting, ...formatting };
    setTextFormatting(newFormatting);
    
    // Save to localStorage only for new documents
    if (useLocalStorage && !documentId) {
      saveTextFormattingToLocalStorage(newFormatting);
    }
    
    // Send to database via socket (only for existing documents)
    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit('text-formatting-update', {
        documentId,
        userId,
        formatting: newFormatting
      });
    }
    
    // Call parent callback
    if (onContentChange) {
      handleContentChangeCallback();
    }
  };

  // ✅ NEW: Content change callback for parent component
  const handleContentChangeCallback = useCallback(() => {
    if (onContentChange && isInitialized) {
      const fullContent = {
        text: content,
        drawings: drawings,
        textFormatting: textFormatting,
        timestamp: Date.now()
      };
      
      // For new documents, send JSON string
      // For existing documents, send object
      if (localMode || !documentId) {
        onContentChange(JSON.stringify(fullContent));
      } else {
        onContentChange(fullContent);
      }
    }
  }, [onContentChange, content, drawings, textFormatting, localMode, documentId, isInitialized]);

  // Debounced content updates for parent
  useEffect(() => {
    if (!isInitialized || !onContentChange) return;
    
    const timeoutId = setTimeout(() => {
      handleContentChangeCallback();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [content, drawings, textFormatting, handleContentChangeCallback, isInitialized]);

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      setContent('');
      setDrawings([]);
      setTextFormatting({
        color: '#000000',
        backgroundColor: 'transparent',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'normal',
        textAlign: 'left'
      });
      
      // Only clear localStorage for new documents
      if (useLocalStorage && !documentId) {
        clearLocalStorageData();
      }
      
      // Clear the contenteditable div if it exists
      const editor = document.querySelector('[contenteditable]');
      if (editor) {
        editor.innerHTML = '';
      }
      
      // Don't reload for existing documents
      if (!documentId) {
        window.location.reload();
      }
    }
  };

  // ✅ NEW: Handle canvas ready callback
  const handleCanvasReady = useCallback((controls) => {
    setCanvasControls(controls);
    console.log('🎨 Canvas controls ready');
  }, []);

  // ✅ MODIFIED: Update canvas mode when switching between drawing and text
  useEffect(() => {
    console.log('canvasControls (effect):', canvasControls);

    if (!canvasControls) {
      console.log('canvasControls not ready — skipping setMode');
      return;
    }

    // Prefer function on object; also support ref-like shape: canvasControls.current
    const ctrl = canvasControls.current ?? canvasControls;

    if (typeof ctrl.setMode === 'function') {
      try {
        ctrl.setMode('drawing');
      } catch (e) {
        console.warn('Failed calling setMode:', e);
      }
      return;
    }

    console.warn('canvasControls.setMode is not a function — value:', canvasControls);
    // If you want to call saveDrawings as fallback for persistence you can:
    // if (typeof ctrl.saveDrawings === 'function') ctrl.saveDrawings().then(...);
  }, [canvasControls]);

  // when mounting, load from storageKey if present, else from initialData
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        // apply saved content to editor
        const parsed = JSON.parse(saved);
        setContent(parsed.text || '');
        setDrawings(parsed.drawings || []);
        setTextFormatting(prev => ({ ...prev, ...parsed.textFormatting }));
      } else {
        // initialize from initialData
        setContent(initialData.text ?? initialData.text_content ?? initialData.content ?? '');
        setDrawings(initialData.drawings ?? initialData.drawings_data ?? []);
        setTextFormatting(prev => ({
          ...prev,
          ...(initialData.textFormatting ?? initialData.text_formatting ?? {})
        }));
      }
    } catch (e) {
      console.warn('CollaborativeNotepad: load failed', e);
    }
    // clean up or save on unmount if needed
  }, [storageKey, initialData]);

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  console.log("CollaborativeNotepad initialData:", initialData);

  return (
    <div className={`w-full flex flex-col ${className || ''}`}>
      <Toolbar
        mode={mode}
        setMode={setMode}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        textFormatting={textFormatting}
        setTextFormatting={handleTextFormattingChange}
        isConnected={isConnected}
        onClearAllData={clearAllData}
      />
      
      <div className="flex-1 relative">
        {/* ✅ MODIFIED: Always render both components but control their interaction */}
        <div className={`absolute inset-0 ${mode === 'draw' ? 'z-10' : 'z-0 pointer-events-none'}`}>
          <DrawingCanvas
            brushColor={brushColor}
            brushSize={brushSize}
            onDrawingData={handleDrawingData}
            socket={localMode ? null : socket}
            drawings={drawings}
            setDrawings={setDrawings}
            useLocalStorage={useLocalStorage && !documentId}
            onCanvasReady={setCanvasControls} // pass setter (do NOT call it)
          />
        </div>
        
        <div className={`absolute inset-0 ${mode === 'text' ? 'z-10' : 'z-0'} ${mode === 'draw' ? 'pointer-events-none' : ''}`}>
          <RichTextEditor
            content={content}
            onContentChange={handleTextChange}
            textFormatting={textFormatting}
            socket={localMode ? null : socket}
            placeholder={placeholder}
            className="w-full h-full"
            disabled={mode === 'draw'} // ✅ NEW: Disable text editing when in draw mode
          />
        </div>
      </div>
    </div>
  );
}