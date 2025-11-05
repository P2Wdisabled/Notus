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
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
      </button>

      {showListMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
          <div className="py-1">
            <button
              title="Liste à puces"
              type="button"
              onClick={() => {
                onFormatChange('insertUnorderedList');
                setShowListMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                <path fill="currentColor" fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2" />
              </svg>
            </button>
            <button
              title="Liste numérotée"
              type="button"
              onClick={() => {
                onFormatChange('insertOrderedList');
                setShowListMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                <g fill="currentColor">
                  <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5" />
                  <path d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317c0-.185-.158-.31-.361-.31c-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787c.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8c-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309c.254 0 .424-.145.422-.35c-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844c.583 0 .96.326.96.756c0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508c0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635z" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
