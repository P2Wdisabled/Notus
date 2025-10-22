import { useState, useEffect, useCallback } from "react";

interface TextFormatting {
  fontSize?: number;
  textAlign?: string;
  [key: string]: any;
}

interface UseTextFormattingReturn {
  hasSelection: boolean;
  selectedText: string;
  detectedFontSize: number | null;
  setDetectedFontSize: (size: number | null) => void;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  applyFormat: (command: string, value?: string | null) => void;
}

export default function useTextFormatting(
  mode: string,
  textFormatting: TextFormatting,
  setTextFormatting: (formatting: TextFormatting | ((prev: TextFormatting) => TextFormatting)) => void
): UseTextFormattingReturn {
  const [hasSelection, setHasSelection] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [detectedFontSize, setDetectedFontSize] = useState<number | null>(null);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);

  // Check selection and formatting state
  useEffect(() => {
    if (mode !== "text") return;

    const checkSelection = () => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString();
        const hasSelectionNow = text.length > 0;

        setHasSelection(hasSelectionNow);
        setSelectedText(text);

        // Check formatting state
        try {
          const bold = document.queryCommandState("bold");
          const italic = document.queryCommandState("italic");
          const underline = document.queryCommandState("underline");

          setIsBold(bold);
          setIsItalic(italic);
          setIsUnderline(underline);

          // Check font size at cursor position or selection
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedNode = range.startContainer;
            let elementToCheck: Element | null = null;

            if (selectedNode.nodeType === 3) {
              elementToCheck = selectedNode.parentElement;
            } else if (
              selectedNode.childNodes.length > 0 &&
              range.startOffset > 0
            ) {
              const childNode = selectedNode.childNodes[range.startOffset - 1];
              elementToCheck =
                childNode.nodeType === 3 ? childNode.parentElement : (childNode as Element);
            } else {
              elementToCheck = selectedNode as Element;
            }

            if (elementToCheck) {
              // walk up to find the nearest block-level ancestor or the contenteditable root
              let node: Element | null = elementToCheck;
              // find the contenteditable root if present
              const contentEditableRoot =
                node.closest && node.closest("[contenteditable]");

              const BLOCK_TAGS = new Set([
                "DIV",
                "P",
                "LI",
                "BLOCKQUOTE",
                "TD",
                "TH",
                "SECTION",
                "ARTICLE",
                "HEADER",
                "FOOTER",
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
              ]);

              let foundAlign: string | null = null;
              while (node) {
                if (node.nodeType === 1) {
                  const cs = window.getComputedStyle(node);
                  // prefer block-level elements or ones that explicitly set text-align
                  if (
                    BLOCK_TAGS.has(node.tagName) ||
                    (cs.display && cs.display !== "inline")
                  ) {
                    if (cs.textAlign && cs.textAlign !== "inherit") {
                      foundAlign = cs.textAlign;
                      break;
                    }
                  }
                }

                // stop at contentEditable root to avoid walking into outer layout
                if (contentEditableRoot && node === contentEditableRoot) break;
                node = node.parentElement;
              }

              // fallback to elementToCheck computed style
              const finalComputed = window.getComputedStyle(elementToCheck);

              // sync font size from the original element (best-effort)
              if (finalComputed.fontSize) {
                const fontSizeValue = Math.round(
                  parseFloat(finalComputed.fontSize)
                );
                if (fontSizeValue && fontSizeValue !== detectedFontSize) {
                  setDetectedFontSize(fontSizeValue);
                  setTimeout(() => {
                    try {
                      setTextFormatting({
                        ...textFormatting,
                        fontSize: fontSizeValue,
                      });
                    } catch (e) {
                      // ignore if setTextFormatting is not available
                    }
                  }, 0);
                }
              }

              // determine alignment: prefer foundAlign then fallback to computed style
              let alignValue = foundAlign || finalComputed.textAlign || "";
              if (alignValue === "start") alignValue = "left";
              if (alignValue === "end") alignValue = "right";

              if (alignValue) {
                // diagnostics: log detected alignment vs current prop
                try {
                  console.debug(
                    "[useTextFormatting] detectedAlign=",
                    alignValue,
                    "propAlign=",
                    textFormatting.textAlign
                  );
                } catch (e) { }

                if (alignValue !== textFormatting.textAlign) {
                  setTimeout(() => {
                    try {
                      setTextFormatting({
                        ...textFormatting,
                        textAlign: alignValue,
                      });
                    } catch (e) {
                      // ignore
                    }
                  }, 0);
                }
              }
            }
          }
        } catch (error) {
          console.log("Could not check formatting state:", error);
        }
      }
    };

    const handleMouseUp = () => checkSelection();
    const handleKeyUp = () => checkSelection();

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    const interval = setInterval(checkSelection, 1000);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
      clearInterval(interval);
    };
  }, [mode, textFormatting, setTextFormatting, detectedFontSize]);

  // Apply format function
  const applyFormat = useCallback((command: string, value: string | null = null): void => {
    if ((window as any).applyRichTextFormat) {
      (window as any).applyRichTextFormat(command, value);
    }
  }, []);

  // Click outside handler for palettes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const colorPalette = document.getElementById("colorPalette");
      const highlightPalette = document.getElementById("highlightPalette");

      if (
        colorPalette &&
        !colorPalette.contains(event.target as Node) &&
        !(event.target as Element).closest("[title='Select text color']")
      ) {
        colorPalette.classList.add("hidden");
      }

      if (
        highlightPalette &&
        !highlightPalette.contains(event.target as Node) &&
        !(event.target as Element).closest("[title='Select highlight color']")
      ) {
        highlightPalette.classList.add("hidden");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    hasSelection,
    selectedText,
    detectedFontSize,
    setDetectedFontSize,
    isBold,
    isItalic,
    isUnderline,
    applyFormat,
  };
}