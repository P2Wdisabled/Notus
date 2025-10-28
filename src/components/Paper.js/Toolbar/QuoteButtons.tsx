"use client";

interface QuoteButtonsProps {
  onFormatChange: (command: string) => void;
}

export default function QuoteButtons({ onFormatChange }: QuoteButtonsProps) {
  return (
    <>
      {/* Quote */}
      <button
        type="button"
        onClick={() => onFormatChange('insertQuote')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Citation (Ctrl+Shift+.)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      </button>

      {/* Horizontal Rule */}
      <button
        type="button"
        onClick={() => onFormatChange('insertHorizontalRule')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Ligne horizontale (Ctrl+Shift+-)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 11h18v2H3z"/>
        </svg>
      </button>
    </>
  );
}
