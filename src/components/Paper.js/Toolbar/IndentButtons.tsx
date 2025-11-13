"use client";

import Icon from "@/components/Icon";
interface IndentButtonsProps {
  onFormatChange: (command: string) => void;
}

export default function IndentButtons({ onFormatChange }: IndentButtonsProps) {
  return (
    <>
      {/* Indent */}
      <button
        type="button"
        onClick={() => onFormatChange('indent')}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground"
        title="Augmenter l'indentation"
      >
        <Icon name="indent" className="h-5 w-5" />
      </button>

      {/* Outdent */}
      <button
        type="button"
        onClick={() => onFormatChange('outdent')}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground"
        title="Diminuer l'indentation"
      >
        <Icon name="outdent" className="h-5 w-5" />
      </button>
    </>
  );
}
