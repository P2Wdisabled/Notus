"use client";

import { useState } from "react";
import { ToolbarPopin } from "./ToolbarPopin";
import FileUploadButton, { UploadedFileData } from "./FileUploadButton";
import Icon from "@/components/Icon";

interface MediaButtonsProps {
  onFormatChange: (command: string, value?: string) => void;
  onShowDrawingModal: () => void;
  isSelectionActive: boolean;
}

export default function MediaButtons({ onFormatChange, onShowDrawingModal, isSelectionActive }: MediaButtonsProps) {
  const [showLinkPopin, setShowLinkPopin] = useState(false);
  const handleInsertLink = (u: string) => {
    try { window.restoreWysiwygSelection?.(); } catch {}
    onFormatChange('createLink', u);
  };

  const handleFileSelect = (file: UploadedFileData) => {
    try { window.restoreWysiwygSelection?.(); } catch {}
    onFormatChange('insertFile', JSON.stringify(file));
  };

  const mediaDisabled = !isSelectionActive;
  const disabledTitle = mediaDisabled ? "Placez le curseur dans le document pour utiliser cette action" : undefined;

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Link */}
      <button
        type="button"
        onClick={() => {
          try { window.saveWysiwygSelection?.(); } catch {}
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
        onClick={() => {
          if (mediaDisabled) return;
          onShowDrawingModal();
        }}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
        title={mediaDisabled ? disabledTitle : "Dessiner (ouvrir le canvas)"}
        disabled={mediaDisabled}
        aria-disabled={mediaDisabled}
      >
        <Icon name="pencil" className="h-5 w-5" />
      </button>

      {/* File Upload */}
      <FileUploadButton onFileSelect={handleFileSelect} disabled={mediaDisabled} />

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
