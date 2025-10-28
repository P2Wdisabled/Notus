"use client";
import { useState } from "react";

interface AlignmentMenuProps {
  onFormatChange: (command: string) => void;
}

export default function AlignmentMenu({ onFormatChange }: AlignmentMenuProps) {
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowAlignMenu(!showAlignMenu)}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Alignement"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
        </svg>
      </button>

      {showAlignMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onFormatChange('justifyLeft');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Aligner à gauche
            </button>
            <button
              type="button"
              onClick={() => {
                onFormatChange('justifyCenter');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Centrer
            </button>
            <button
              type="button"
              onClick={() => {
                onFormatChange('justifyRight');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Aligner à droite
            </button>
            <button
              type="button"
              onClick={() => {
                onFormatChange('justifyFull');
                setShowAlignMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Justifier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
