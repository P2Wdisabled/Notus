export default function FormatButtons({
  isBold,
  isItalic,
  isUnderline,
  applyFormat,
}) {
  return (
    <div className="flex items-center space-x-1">
      <button
        type="button"
        onClick={() => applyFormat("bold")}
        className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
          isBold
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => applyFormat("italic")}
        className={`px-2 py-1 rounded text-sm italic transition-colors ${
          isItalic
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => applyFormat("underline")}
        className={`px-2 py-1 rounded text-sm underline transition-colors ${
          isUnderline
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Underline (Ctrl+U)"
      >
        U
      </button>
    </div>
  );
}
