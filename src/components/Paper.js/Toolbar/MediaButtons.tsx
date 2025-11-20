"use client";

import { useState } from "react";
import { ToolbarPopin } from "./ToolbarPopin";
import FileUploadButton, { UploadedFileData } from "./FileUploadButton";
import Icon from "@/components/Icon";

interface MediaButtonsProps {
  onFormatChange: (command: string, value?: string) => void;
  onShowDrawingModal: () => void;
}

export default function MediaButtons({ onFormatChange, onShowDrawingModal }: MediaButtonsProps) {
  const [showLinkPopin, setShowLinkPopin] = useState(false);
  const handleInsertLink = (u: string) => {
    try { (window as any).restoreWysiwygSelection?.(); } catch {}
    onFormatChange('createLink', u);
  };

  const handleFileSelect = (file: UploadedFileData) => {
    try { (window as any).restoreWysiwygSelection?.(); } catch {}
    onFormatChange('insertFile', JSON.stringify(file));
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Link */}
      <button
        type="button"
        onClick={() => {
          try { (window as any).saveWysiwygSelection?.(); } catch {}
          setShowLinkPopin((s) => !s);
        }}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground"
        title="Lien"
      >
        <Icon name="link" className="h-5 w-5" />
      </button>

      {/* Draw (Canvas) */}
      <button
        type="button"
        onClick={onShowDrawingModal}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground"
        title="Dessiner (ouvrir le canvas)"
      >
        <Icon name="pencil" className="h-5 w-5" />
      </button>

      {/* File Upload */}
      <FileUploadButton onFileSelect={handleFileSelect} />

      {showLinkPopin && (
        <ToolbarPopin
          mode="link"
          onClose={() => setShowLinkPopin(false)}
          onInsertUrl={handleInsertLink}
        />
      )}
    </div>
  );
}
