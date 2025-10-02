export default function ModeSelector({ mode, setMode, onClearAllData }) {
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => setMode("draw")}
        className={`px-4 py-2 rounded transition-colors ${
          mode === "draw" ? "bg-blue-500" : "bg-gray-600 hover:bg-gray-500"
        }`}
      >
        Draw
      </button>
      <button
        onClick={() => setMode("text")}
        className={`px-4 py-2 rounded transition-colors ${
          mode === "text" ? "bg-blue-500" : "bg-gray-600 hover:bg-gray-500"
        }`}
      >
        Text
      </button>

      {onClearAllData && (
        <button
          onClick={onClearAllData}
          className="px-3 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors text-sm"
          title="Clear all local data"
        >
          Clear Data
        </button>
      )}
    </div>
  );
}