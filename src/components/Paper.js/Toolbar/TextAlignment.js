export default function TextAlignment({
  textFormatting,
  setTextFormatting,
  applyFormat,
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setTextFormatting({
            ...textFormatting,
            textAlign: "left",
          });
          applyFormat("justifyLeft");
        }}
        className={`p-2 rounded ${
          textFormatting.textAlign === "left"
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Align Left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={() => {
          setTextFormatting({
            ...textFormatting,
            textAlign: "center",
          });
          applyFormat("justifyCenter");
        }}
        className={`p-2 rounded ${
          textFormatting.textAlign === "center"
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Align Center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={() => {
          setTextFormatting({
            ...textFormatting,
            textAlign: "right",
          });
          applyFormat("justifyRight");
        }}
        className={`p-2 rounded ${
          textFormatting.textAlign === "right"
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
        title="Align Right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
        </svg>
      </button>
    </div>
  );
}
