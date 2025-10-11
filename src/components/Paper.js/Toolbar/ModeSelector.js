export default function ModeSelector({ mode, setMode, onClearAllData }) {
  return (
    <div className="flex items-center space-x-4">
      <button
        type="button"
        onClick={() => setMode("draw")}
        className={`px-4 py-2 rounded transition-colors ${
          mode === "draw"
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
      >
        Draw
      </button>
      <button
        type="button"
        onClick={() => setMode("text")}
        className={`px-4 py-2 rounded transition-colors ${
          mode === "text"
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple disabled:bg-gray disabled:cursor-not-allowed text-white font-semibold rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
            : "bg-gray-600 hover:bg-gray-500 rounded-lg hover:shadow-md shadow-light-gray dark:shadow-light-black transition-all duration-200 cursor-pointer"
        }`}
      >
        Text
      </button>

      {/* {onClearAllData && (
        <button
          onClick={onClearAllData}
          className="px-3 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors text-sm"
          title="Clear all local data"
        >
          Clear Data
        </button>
      )} */}
    </div>
  );
}
