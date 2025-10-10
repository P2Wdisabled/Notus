export default function DrawControls({ brushColor, setBrushColor, brushSize, setBrushSize }) {
  return (
    <div className="flex items-center space-x-4">
      <input
        type="color"
        value={brushColor}
        onChange={(e) => setBrushColor(e.target.value)}
        className="w-10 h-10 cursor-pointer"
      />
      <input
        type="range"
        min="1"
        max="20"
        value={brushSize}
        onChange={(e) => setBrushSize(parseInt(e.target.value))}
        className="w-32 cursor-pointer"
      />
      <span className="text-sm">Size: {brushSize}px</span>
    </div>
  );
}