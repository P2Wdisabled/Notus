"use client";

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
        </svg>
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
        </svg>
      </button>
    </>
  );
}
