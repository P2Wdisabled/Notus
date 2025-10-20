interface DrawControlsProps {
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onClearDrawings?: () => void;
}

export default function DrawControls({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  onClearDrawings,
}: DrawControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <input
          type="color"
          id="brushColorInput"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="absolute opacity-0 w-0 h-0"
        />
        <button
          type="button"
          onClick={() => {
            document.getElementById("brushColorInput")?.click();
          }}
          className="p-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all hover:shadow-md relative"
          title="Select brush color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z"/>
          </svg>
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
            style={{ backgroundColor: brushColor }}
          />
        </button>
      </div>
      
      <div className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z"/>
        </svg>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-24 cursor-pointer"
          title={`Brush Size: ${brushSize}px`}
        />
        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[3rem]">{brushSize}px</span>
      </div>
      
      {onClearDrawings && (
        <button
          onClick={onClearDrawings}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          title="Clear Drawings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

