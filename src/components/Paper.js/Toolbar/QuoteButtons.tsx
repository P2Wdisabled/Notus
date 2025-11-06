"use client";

import Icon from "@/components/Icon";
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
        <Icon name="quote" className="h-5 w-5" />
      </button>

      {/* Horizontal Rule */}
      <button
        type="button"
        onClick={() => onFormatChange('insertHorizontalRule')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Ligne horizontale (Ctrl+Shift+-)"
      >
        <Icon name="minus" className="h-5 w-5" />
      </button>
    </>
  );
}
