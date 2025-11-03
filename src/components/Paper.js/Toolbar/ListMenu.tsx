"use client";
import { useState, useEffect } from "react";

interface ListMenuProps {
  onFormatChange: (command: string) => void;
}

export default function ListMenu({ onFormatChange }: ListMenuProps) {
  const [showListMenu, setShowListMenu] = useState(false);
  const MENU_ID = 'listMenu';

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (ce.detail !== MENU_ID) setShowListMenu(false);
    };
    window.addEventListener('wysiwyg:open-menu', handler as EventListener);
    return () => window.removeEventListener('wysiwyg:open-menu', handler as EventListener);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!showListMenu) return;
    const onDocMouse = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      if (target && !target.closest('[data-list-menu]')) setShowListMenu(false);
    };
    document.addEventListener('mousedown', onDocMouse);
    return () => document.removeEventListener('mousedown', onDocMouse);
  }, [showListMenu]);

  return (
    <div className="relative" data-list-menu>
      <button
        type="button"
        onClick={() => {
          const next = !showListMenu;
          setShowListMenu(next);
          if (next) window.dispatchEvent(new CustomEvent('wysiwyg:open-menu', { detail: MENU_ID }));
          else window.dispatchEvent(new CustomEvent('wysiwyg:open-menu', { detail: '' }));
        }}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Liste"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        </svg>
      </button>

      {showListMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onFormatChange('insertUnorderedList');
                setShowListMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              • Liste à puces
            </button>
            <button
              type="button"
              onClick={() => {
                onFormatChange('insertOrderedList');
                setShowListMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              1. Liste numérotée
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
