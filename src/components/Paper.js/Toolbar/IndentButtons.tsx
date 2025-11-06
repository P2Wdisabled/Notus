"use client";

import Icon from "@/components/Icon";
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
        <Icon name="indent" className="h-5 w-5" />
      </button>

      {/* Outdent */}
      <button
        type="button"
        onClick={() => onFormatChange('outdent')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Diminuer l'indentation"
      >
        <Icon name="outdent" className="h-5 w-5" />
      </button>
    </>
  );
}
