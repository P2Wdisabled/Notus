"use client";

import Icon from "@/components/Icon";
interface FormatButtonsProps {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  onFormatChange: (command: string) => void;
}

export default function FormatButtons({ 
  isBold, 
  isItalic, 
  isUnderline, 
  isStrikethrough, 
  onFormatChange 
}: FormatButtonsProps) {
  return (
    <>
      {/* Bold */}
      <button
        type="button"
        onClick={() => onFormatChange('bold')}
        className={`p-2 rounded transition-colors ${
          isBold
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Gras (Ctrl+B)"
      >
        <Icon name="bold" className="h-5 w-5" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => onFormatChange('italic')}
        className={`p-2 rounded transition-colors ${
          isItalic
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Italique (Ctrl+I)"
      >
        <Icon name="italic" className="h-5 w-5" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => onFormatChange('underline')}
        className={`p-2 rounded transition-colors ${
          isUnderline
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Souligné (Ctrl+U)"
      >
        <Icon name="underline" className="h-5 w-5" />
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onClick={() => onFormatChange('strikeThrough')}
        className={`p-2 rounded transition-colors ${
          isStrikethrough
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Barré"
      >
        <Icon name="strikethrough" className="h-5 w-5" />
      </button>
    </>
  );
}
