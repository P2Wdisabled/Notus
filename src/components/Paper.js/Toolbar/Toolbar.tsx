"use client";
import ModeSelector from "./ModeSelector";
import DrawControls from "./DrawControls";
import TextControls from "./TextControls";

interface TextFormatting {
  [key: string]: any;
}

interface ToolbarProps {
  mode: string;
  setMode: (mode: string) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  textFormatting: TextFormatting;
  setTextFormatting: (formatting: TextFormatting) => void;
  onClearAllData: () => void;
  onClearDrawings: () => void;
  calMode?: boolean;
}

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
}: ToolbarProps) {
  return (
    <div className="bg-transparent text-foreground p-4 flex flex-wrap items-center gap-1">
      <ModeSelector
        mode={mode}
        setMode={setMode}
        onClearAllData={onClearAllData}
      />

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      <div className={mode === "draw" ? "flex items-center gap-1" : "hidden"}>
        <DrawControls
          brushColor={brushColor}
          setBrushColor={setBrushColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onClearDrawings={onClearDrawings}
        />
      </div>

      <div className={mode === "text" ? "flex items-center gap-1" : "hidden"}>
        <TextControls
          textFormatting={textFormatting}
          setTextFormatting={setTextFormatting}
        />
      </div>
    </div>
  );
}

