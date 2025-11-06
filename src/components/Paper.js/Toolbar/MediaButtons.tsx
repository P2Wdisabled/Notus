"use client";

import { useState } from "react";
import { ToolbarPopin } from "./ToolbarPopin";

interface MediaButtonsProps {
  onFormatChange: (command: string, value?: string) => void;
  onShowDrawingModal: () => void;
}

export default function MediaButtons({ onFormatChange, onShowDrawingModal }: MediaButtonsProps) {
  const [showImagePopin, setShowImagePopin] = useState(false);
  const [showLinkPopin, setShowLinkPopin] = useState(false);
  const handleInsertImage = (u: string) => {

    try { (window as any).restoreWysiwygSelection?.(); } catch {}
    onFormatChange('insertImage', u);
  };
  const handleInsertLink = (u: string) => {
    try { (window as any).restoreWysiwygSelection?.(); } catch {}
    onFormatChange('createLink', u);
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Link */}
      <button
        type="button"
        onClick={() => {
          try { (window as any).saveWysiwygSelection?.(); } catch {}
          setShowLinkPopin((s) => !s);
        }}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Lien"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      </button>

      {/* Image (insert by URL for now) */}
      <button
        type="button"
        onClick={() => {
          try { (window as any).saveWysiwygSelection?.(); } catch {}
          setShowImagePopin((s) => !s);
        }}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Image (par URL)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </button>

      {/* Draw (Canvas) */}
      <button
        type="button"
        onClick={onShowDrawingModal}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Dessiner (ouvrir le canvas)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
        </svg>
      </button>

      {showImagePopin && (
        <ToolbarPopin
          mode="image"
          onClose={() => setShowImagePopin(false)}
          onInsertUrl={handleInsertImage}
        />
      )}

      {showLinkPopin && (
        <ToolbarPopin
          mode="link"
          onClose={() => setShowLinkPopin(false)}
          onInsertUrl={handleInsertLink}
        />
      )}
    </div>
  );
}
