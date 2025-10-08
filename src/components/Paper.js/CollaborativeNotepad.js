'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import RichTextEditor from './RichTextEditor';
import Toolbar from './Toolbar/Toolbar.js';
import { useSocket } from '../../lib/paper.js/socket';

const DrawingCanvas = dynamic(() => import('./DrawingCanvas'), {
  ssr: true,
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
  localMode = false,
  placeholder = 'Start typing...',
  className = '',
  initialContent = ''
}) {
  const [mode, setMode] = useState('draw');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [content, setContent] = useState('');
  const [drawings, setDrawings] = useState([]);
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

  useEffect(() => {
    if (isInitialized) return;

    if (initialData) {
      let dbTextContent = '';
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
        dbTextContent = initialData.text ?? initialData.content ?? '';
      }

      setContent(dbTextContent);
      setDrawings(dbDrawings);
      setTextFormatting(prev => ({ ...prev, ...dbTextFormatting }));
    } else if (initialContent) {
      setContent(initialContent);
    } else {
      // defaults already set in state initialization
    }

    setIsInitialized(true);
  }, [initialData, initialContent, isInitialized]);

  useEffect(() => {
    if (socket && documentId && !localMode) {
      socket.emit('join-document', documentId);
    }
  }, [socket, documentId, localMode]);

  useEffect(() => {
    if (!socket || localMode) return;

    const handleDocumentState = (data) => {
      if (!isInitialized) return;
      setContent(data.content || '');
      setDrawings(data.drawings || []);
      if (data.textFormatting) {
        setTextFormatting(prev => ({ ...prev, ...data.textFormatting }));
      }
    };

    const handleDrawingData = (data) => {
      setDrawings(prev => [...prev, data.drawingData]);
    };

    const handleTextUpdate = (data) => {
      setContent(data.content);
    };

    const handleTextFormattingUpdate = (data) => {
      setTextFormatting(prev => ({ ...prev, ...data.formatting }));
    };

    const handleClearCanvas = () => {
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
  }, [socket, localMode, isInitialized]);

  const handleDrawingData = (data) => {
    setDrawings(prev => [...prev, data]);
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
    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit('text-update', {
        documentId,
        userId,
        content: newContent
      });
    }
    if (onContentChange) {
      handleContentChangeCallback();
    }
  };

  const handleTextFormattingChange = (formatting) => {
    const newFormatting = { ...textFormatting, ...formatting };
    setTextFormatting(newFormatting);
    if (socket && isConnected && documentId && userId && !localMode) {
      socket.emit('text-formatting-update', {
        documentId,
        userId,
        formatting: newFormatting
      });
    }
    if (onContentChange) {
      handleContentChangeCallback();
    }
  };

  const handleContentChangeCallback = useCallback(() => {
    if (onContentChange && isInitialized) {
      const fullContent = {
        text: content,
        drawings: drawings,
        textFormatting: textFormatting,
        timestamp: Date.now()
      };

      if (localMode || !documentId) {
        onContentChange(JSON.stringify(fullContent));
      } else {
        onContentChange(fullContent);
      }
    }
  }, [onContentChange, content, drawings, textFormatting, localMode, documentId, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !onContentChange) return;

    const timeoutId = setTimeout(() => {
      handleContentChangeCallback();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [content, drawings, textFormatting, handleContentChangeCallback, isInitialized]);

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
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

      const editor = document.querySelector('[contenteditable]');
      if (editor) {
        editor.innerHTML = '';
      }
    }
  };

  useEffect(() => {
    if (!canvasControls) return;
    const ctrl = canvasControls.current ?? canvasControls;
    if (typeof ctrl.setMode === 'function') {
      try {
        ctrl.setMode('drawing');
      } catch (e) {
        // ignore
      }
      return;
    }
  }, [canvasControls]);

  if (!isInitialized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

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
        <div className={`absolute inset-0 ${mode === 'draw' ? 'z-10' : 'z-0 pointer-events-none'}`}>
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
        
        <div className={`absolute inset-0 ${mode === 'text' ? 'z-10' : 'z-0'} ${mode === 'draw' ? 'pointer-events-none' : ''}`}>
          <RichTextEditor
            content={content}
            onContentChange={handleTextChange}
            textFormatting={textFormatting}
            socket={localMode ? null : socket}
            placeholder={placeholder}
            className="w-full h-full"
            disabled={mode === 'draw'}
          />
        </div>
      </div>
    </div>
  );
}