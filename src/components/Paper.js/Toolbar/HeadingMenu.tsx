"use client";
import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

interface HeadingMenuProps {
  onFormatChange: (command: string, value: string) => void;
}

export default function HeadingMenu({ onFormatChange }: HeadingMenuProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const MENU_ID = 'headingMenu';

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (ce.detail !== MENU_ID) setShowHeadingMenu(false);
    };
    window.addEventListener('wysiwyg:open-menu', handler as EventListener);
    return () => window.removeEventListener('wysiwyg:open-menu', handler as EventListener);
  }, []);

  // Close when clicking outside the heading menu
  useEffect(() => {
    if (!showHeadingMenu) return;
    const onDocMouse = (ev: MouseEvent) => {
      const target = ev.target as Element | null;
      if (target && !target.closest('[data-heading-menu]')) {
        setShowHeadingMenu(false);
        window.dispatchEvent(new CustomEvent('wysiwyg:open-menu', { detail: '' }));
      }
    };
    document.addEventListener('mousedown', onDocMouse);
    return () => document.removeEventListener('mousedown', onDocMouse);
  }, [showHeadingMenu]);

  return (
    <div className="relative inline-block" data-heading-menu>
      <button
        type="button"
        onClick={() => {
          const next = !showHeadingMenu;
          setShowHeadingMenu(next);
          if (next) window.dispatchEvent(new CustomEvent('wysiwyg:open-menu', { detail: MENU_ID }));
          else window.dispatchEvent(new CustomEvent('wysiwyg:open-menu', { detail: '' }));
        }}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Titre"
      >
        <Icon name="heading" className="w-5 h-5" />
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
