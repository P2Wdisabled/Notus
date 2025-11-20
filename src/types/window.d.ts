// Global window extensions for WYSIWYG editor
declare global {
  interface Window {
    handleWysiwygUndo?: () => void;
    handleWysiwygRedo?: () => void;
    canWysiwygUndo?: () => boolean;
    canWysiwygRedo?: () => boolean;
    applyWysiwygFormatting?: (command: string, value?: string) => void;
    getCurrentImageForEditing?: () => { src: string; naturalWidth: number; naturalHeight: number; styleWidth: string; styleHeight: string } | null;
    applyImageEdit?: (payload: { src?: string; widthPercent?: number; widthPx?: number }) => void;
    openImageEditModal?: () => void;
    saveWysiwygSelection?: () => void;
    restoreWysiwygSelection?: () => void;
  }

  interface Document {
    caretPositionFromPoint?(x: number, y: number): { offsetNode: Node; offset: number } | null;
  }
}

export {};

