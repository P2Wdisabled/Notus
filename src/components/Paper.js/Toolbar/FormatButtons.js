export default function FormatButtons({ isBold, isItalic, isUnderline, applyFormat }) {
  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => applyFormat("bold")}
        className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
          isBold
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200"
        }`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        onClick={() => applyFormat("italic")}
        className={`px-2 py-1 rounded text-sm italic transition-colors ${
          isItalic
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200"
        }`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        onClick={() => applyFormat("underline")}
        className={`px-2 py-1 rounded text-sm underline transition-colors ${
          isUnderline
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200"
        }`}
        title="Underline (Ctrl+U)"
      >
        U
      </button>
    </div>
  );
}