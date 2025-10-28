"use client";

interface IndentButtonsProps {
  onFormatChange: (command: string) => void;
}

export default function IndentButtons({ onFormatChange }: IndentButtonsProps) {
  return (
    <>
      {/* Indent */}
      <button
        type="button"
        onClick={() => onFormatChange('indent')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Augmenter l'indentation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 5v2h18V5H3z"/>
        </svg>
      </button>

      {/* Outdent */}
      <button
        type="button"
        onClick={() => onFormatChange('outdent')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Diminuer l'indentation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zM7 8v8l-4-4 4-4zm4 9h10v-2H11v2zM3 5v2h18V5H3z"/>
        </svg>
      </button>
    </>
  );
}
