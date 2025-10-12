"use client";
import ModeSelector from "./ModeSelector";
import DrawControls from "./DrawControls";
import TextControls from "./TextControls";

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
  onClearDrawings,
}) {
  return (
    <div className="bg-white dark:bg-black text-white p-4 gap-4 flex flex-wrap">
      <ModeSelector
        mode={mode}
        setMode={setMode}
        onClearAllData={onClearAllData}
      />

      <div className={mode === "draw" ? "block" : "hidden"}>
        <DrawControls
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onClearDrawings={onClearDrawings}
        />
      </div>

      <div className={mode === "text" ? "block" : "hidden"}>
        <TextControls
          textFormatting={textFormatting}
          setTextFormatting={setTextFormatting}
        />
      </div>
    </div>
  );
}
