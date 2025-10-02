'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function CollaborativeNotepad({ roomId = 'default-room' }) {
  const [mode, setMode] = useState('draw');
  const [useRichText, setUseRichText] = useState(false); // Toggle between simple and rich text
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [content, setContent] = useState('');
  const [textFormatting, setTextFormatting] = useState({
    color: '#000000',
    backgroundColor: 'transparent',
    fontSize: 16,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'normal',
    textAlign: 'left'
  });
  
  const { socket, isConnected } = useSocket(roomId);

  // Load initial settings from localStorage
  useEffect(() => {
    const savedSettings = getSettings();
    if (savedSettings) {
      setMode(savedSettings.mode || 'draw');
      setBrushColor(savedSettings.brushColor || '#000000');
      setBrushSize(savedSettings.brushSize || 3);
    }
    
    // Load text formatting from localStorage
    const savedData = getLocalStorageData();
    if (savedData.textFormatting) {
      setTextFormatting(savedData.textFormatting);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = {
      mode,
      brushColor,
      brushSize,
      lastUpdated: Date.now()
    };
    saveSettings(settings);
  }, [mode, brushColor, brushSize]);

  // Handle incoming collaboration events
  useEffect(() => {
    if (!socket) return;

    const handleDrawingData = (data) => {
      console.log('Received drawing data:', data);
    };

    const handleTextUpdate = (data) => {
      setContent(data.content);
    };

    const handleTextFormattingUpdate = (data) => {
      setTextFormatting(data.formatting);
      saveTextFormattingToLocalStorage(data.formatting);
    };

    const handleClearCanvas = () => {
      console.log('Clear canvas received');
    };

    socket.on('drawing-data', handleDrawingData);
    socket.on('text-update', handleTextUpdate);
    socket.on('text-formatting-update', handleTextFormattingUpdate);
    socket.on('clear-canvas', handleClearCanvas);

    return () => {
      socket.off('drawing-data', handleDrawingData);
      socket.off('text-update', handleTextUpdate);
      socket.off('text-formatting-update', handleTextFormattingUpdate);
      socket.off('clear-canvas', handleClearCanvas);
    };
  }, [socket]);

  const handleDrawingData = (data) => {
    if (socket && isConnected) {
      socket.emit('drawing-data', data);
    }
  };

  const handleTextChange = (newContent) => {
    setContent(newContent);
    if (socket && isConnected) {
      socket.emit('text-update', { content: newContent });
    }
  };

  const handleTextFormattingChange = (formatting) => {
    const newFormatting = { ...textFormatting, ...formatting };
    setTextFormatting(newFormatting);
    saveTextFormattingToLocalStorage(newFormatting);
    if (socket && isConnected) {
      socket.emit('text-formatting-update', { formatting: newFormatting });
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      if (clearLocalStorageData()) {
        // Also clear current state
        setContent('');
        setTextFormatting({
          color: '#000000',
          backgroundColor: 'transparent',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 'normal',
          textAlign: 'left'
        });
        
        // Clear the contenteditable div if it exists
        const editor = document.querySelector('[contenteditable]');
        if (editor) {
          editor.innerHTML = '';
        }
        
        window.location.reload();
      } else {
        alert('Error clearing data. Please try again.');
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      
      {useRichText ? (
        <RichToolbar
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
          content={content}
        />
      ) : (
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
      )}
      
      <div className="flex-1 relative">
        {mode === 'draw' ? (
          <DrawingCanvas
            brushColor={brushColor}
            brushSize={brushSize}
            onDrawingData={handleDrawingData}
            socket={socket}
          />
        ) : (
          <RichTextEditor
            content={content}
            onContentChange={handleTextChange}
            textFormatting={textFormatting}
            socket={socket}
          />
        )}
      </div>
    </div>
  );
}