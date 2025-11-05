"use client";
import { useState, useEffect } from "react";

interface AlignmentMenuProps {
  onFormatChange: (command: string) => void;
}

export default function AlignmentMenu({ onFormatChange }: AlignmentMenuProps) {
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  useEffect(() => {
    if (!showAlignMenu) return;
    const onDocMouse = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      if (target && !target.closest('[data-align-menu]')) {
        setShowAlignMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocMouse);
    return () => document.removeEventListener('mousedown', onDocMouse);
  }, [showAlignMenu]);

  return (
  <div className="relative inline-block" data-align-menu>
      <button
        type="button"
        onClick={() => setShowAlignMenu(!showAlignMenu)}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Alignement"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" />
        </svg>
      </button>

      {showAlignMenu && (
        <div className="absolute top-full left-1/2 mt-1 transform -translate-x-1/2 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
          <div className="py-1 flex flex-row">
            <button
              title="Aligner à gauche"
              type="button"
              onClick={() => {
                onFormatChange('justifyLeft');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 18h10M4 14h16M4 10h10M4 6h16" /></svg>
            </button>
            <button
              title="Centrer"
              type="button"
              onClick={() => {
                onFormatChange('justifyCenter');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 18H7m13-4H4m13-4H7m13-4H4" /></svg>
            </button>
            <button
              title="Aligner à droite"
              type="button"
              onClick={() => {
                onFormatChange('justifyRight');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 18H10m10-4H4m16-4H10m10-4H4" /></svg>
            </button>
            <button
              title="Justifier"
              type="button"
              onClick={() => {
                onFormatChange('justifyFull');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 18H4m16-4H4m16-4H4m16-4H4" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
