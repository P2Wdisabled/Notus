export default function TextAlignment({ textFormatting, setTextFormatting, applyFormat }) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Align:</label>
      <div className="flex space-x-1">
        <button
          onClick={() => {
            setTextFormatting({
              ...textFormatting,
              textAlign: "left",
            });
            applyFormat("justifyLeft");
          }}
          className={`px-2 py-1 rounded text-sm ${
            textFormatting.textAlign === "left"
              ? "bg-blue-500"
              : "bg-gray-600 hover:bg-gray-500"
          }`}
        >
          L
        </button>
        <button
          onClick={() => {
            setTextFormatting({
              ...textFormatting,
              textAlign: "center",
            });
            applyFormat("justifyCenter");
          }}
          className={`px-2 py-1 rounded text-sm ${
            textFormatting.textAlign === "center"
              ? "bg-blue-500"
              : "bg-gray-600 hover:bg-gray-500"
          }`}
        >
          C
        </button>
        <button
          onClick={() => {
            setTextFormatting({
              ...textFormatting,
              textAlign: "right",
            });
            applyFormat("justifyRight");
          }}
          className={`px-2 py-1 rounded text-sm ${
            textFormatting.textAlign === "right"
              ? "bg-blue-500"
              : "bg-gray-600 hover:bg-gray-500"
          }`}
        >
          R
        </button>
      </div>
    </div>
  );
}