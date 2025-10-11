export default function TextAlignment({
  textFormatting,
  setTextFormatting,
  applyFormat,
}) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Align:</label>
      <div className="flex space-x-1">
        <button
          type="button"
          onClick={() => {
            setTextFormatting({
              ...textFormatting,
              textAlign: "left",
            });
            applyFormat("justifyLeft");
          }}
          className={`px-2 py-1 rounded text-sm ${
            textFormatting.textAlign === "left"
              ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
              : "bg-gray-600 hover:bg-gray-500 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
          }`}
        >
          L
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
          className={`px-2 py-1 rounded text-sm ${
            textFormatting.textAlign === "center"
              ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
              : "bg-gray-600 hover:bg-gray-500 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
          }`}
        >
          C
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
          className={`px-2 py-1 rounded text-sm ${
            textFormatting.textAlign === "right"
              ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
              : "bg-gray-600 hover:bg-gray-500 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
          }`}
        >
          R
        </button>
      </div>
    </div>
  );
}
