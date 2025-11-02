"use client";
import { useState } from "react";

interface HeadingMenuProps {
  onFormatChange: (command: string, value: string) => void;
}

export default function HeadingMenu({ onFormatChange }: HeadingMenuProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowHeadingMenu(!showHeadingMenu)}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Titre"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
        </svg>
      </button>

      {showHeadingMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onFormatChange('formatBlock', 'div');
                setShowHeadingMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Normal
            </button>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  onFormatChange('formatBlock', `h${level}`);
                  setShowHeadingMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                H{level} - {level === 1 ? 'Titre principal' : level === 2 ? 'Sous-titre' : level === 3 ? 'Titre de section' : `Titre niveau ${level}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
