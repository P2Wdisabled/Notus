interface FormatButtonsProps {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  applyFormat: (command: string, value?: string) => void;
}

export default function FormatButtons({
  isBold,
  isItalic,
  isUnderline,
  applyFormat,
}: FormatButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => applyFormat("bold")}
        className={`p-2 rounded transition-colors ${
          isBold
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Bold (Ctrl+B)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={() => applyFormat("italic")}
        className={`p-2 rounded transition-colors ${
          isItalic
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Italic (Ctrl+I)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={() => applyFormat("underline")}
        className={`p-2 rounded transition-colors ${
          isUnderline
            ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Underline (Ctrl+U)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </button>
    </div>
  );
}

