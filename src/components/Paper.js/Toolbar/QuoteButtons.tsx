"use client";

import Icon from "@/components/Icon";
interface QuoteButtonsProps {
  onFormatChange: (command: string) => void;
}

export default function QuoteButtons({ onFormatChange }: QuoteButtonsProps) {
  return (
    <>
      {/* Quote */}
      <button
        type="button"
        onClick={() => onFormatChange('insertQuote')}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground"
        title="Citation (Ctrl+Shift+.)"
      >
        <Icon name="quote" className="h-5 w-5" />
      </button>

      {/* Horizontal Rule */}
      <button
        type="button"
        onClick={() => onFormatChange('insertHorizontalRule')}
        className="p-2 rounded transition-colors bg-muted hover:bg-muted/80 text-foreground"
        title="Ligne horizontale (Ctrl+Shift+-)"
      >
        <Icon name="minus" className="h-5 w-5" />
      </button>
    </>
  );
}
