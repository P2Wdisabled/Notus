"use client";
import ModeSelector from './ModeSelector';
import DrawControls from './DrawControls';
import TextControls from './TextControls';

export default function Toolbar({
  mode,
  setMode,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  textFormatting,
  setTextFormatting,
  onClearAllData,
}) {
  return (
    <div className="bg-gray-800 text-white p-4 gap-4 flex flex-wrap">
      <ModeSelector 
        mode={mode} 
        setMode={setMode} 
        onClearAllData={onClearAllData} 
      />
      
      {mode === "draw" && (
        <DrawControls
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
        />
      )}

      {mode === "text" && (
        <TextControls
          textFormatting={textFormatting}
          setTextFormatting={setTextFormatting}
        />
      )}
    </div>
  );
}