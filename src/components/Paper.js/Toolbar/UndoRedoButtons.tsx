"use client";

import Icon from "@/components/Icon";

interface UndoRedoButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onFormatChange: (command: string) => void;
}

export default function UndoRedoButtons({ canUndo, canRedo, onFormatChange }: UndoRedoButtonsProps) {
  return (
    <>
      {/* Undo */}
      <button
        type="button"
        onClick={() => {
          if ((window as any).handleWysiwygUndo) {
            (window as any).handleWysiwygUndo();
          } else {
            onFormatChange('undo');
          }
        }}
        disabled={!canUndo}
        className={`p-2 rounded transition-colors ${
          canUndo
            ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
            : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        }`}
        title="Annuler (Ctrl+Z)"
      >
        <Icon name="undo" className="h-5 w-5" />
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={() => {
          if ((window as any).handleWysiwygRedo) {
            (window as any).handleWysiwygRedo();
          } else {
            onFormatChange('redo');
          }
        }}
        disabled={!canRedo}
        className={`p-2 rounded transition-colors ${
          canRedo
            ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
            : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        }`}
        title="Rétablir (Ctrl+Y ou Ctrl+Shift+Z)"
      >
        <Icon name="redo" className="h-5 w-5" />
      </button>
    </>
  );
}
