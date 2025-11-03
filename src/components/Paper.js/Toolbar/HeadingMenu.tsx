"use client";
import { useState } from "react";

interface HeadingMenuProps {
  onFormatChange: (command: string, value: string) => void;
}

export default function HeadingMenu({ onFormatChange }: HeadingMenuProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowHeadingMenu(!showHeadingMenu)}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Titre"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M10.5 20V7H5V4h14v3h-5.5v13z"/></svg>
      </button>

      {showHeadingMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50 min-w-max">
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onFormatChange('formatBlock', 'div');
                setShowHeadingMenu(false);
              }}
              className="w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between whitespace-nowrap"
            >
              16px - Normal
            </button>
            {[1, 2, 3, 4, 5, 6].map((level) => (
                <button
                key={level}
                type="button"
                onClick={() => {
                  onFormatChange('formatBlock', `h${level}`);
                  setShowHeadingMenu(false);
                }}
                className="w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between whitespace-nowrap"
                >
                {level === 1
                  ? '30px - Titre principal'
                  : level === 2
                  ? '24px - Sous-titre'
                  : level === 3
                  ? '20px - Titre de section'
                  : `${level === 4 ? '18px' : level === 5 ? '16px' : '14px'} - Titre niveau ${level}`}
                </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
