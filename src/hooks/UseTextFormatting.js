import { useState, useEffect, useCallback } from 'react';

export default function useTextFormatting(mode, textFormatting, setTextFormatting) {
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [detectedFontSize, setDetectedFontSize] = useState(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

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
            let elementToCheck;

            if (selectedNode.nodeType === 3) {
              elementToCheck = selectedNode.parentElement;
            } else if (
              selectedNode.childNodes.length > 0 &&
              range.startOffset > 0
            ) {
              const childNode = selectedNode.childNodes[range.startOffset - 1];
              elementToCheck =
                childNode.nodeType === 3 ? childNode.parentElement : childNode;
            } else {
              elementToCheck = selectedNode;
            }

            if (elementToCheck) {
              const computedStyle = window.getComputedStyle(elementToCheck);
              if (computedStyle.fontSize) {
                const fontSizeValue = Math.round(
                  parseFloat(computedStyle.fontSize)
                );

                if (fontSizeValue && fontSizeValue !== detectedFontSize) {
                  setDetectedFontSize(fontSizeValue);
                  setTimeout(
                    () =>
                      setTextFormatting((prev) => ({
                        ...prev,
                        fontSize: fontSizeValue,
                      })),
                    0
                  );
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
  }, [mode, textFormatting.fontSize, setTextFormatting, detectedFontSize]);

  // Apply format function
  const applyFormat = useCallback((command, value = null) => {
    if (window.applyRichTextFormat) {
      window.applyRichTextFormat(command, value);
    }
  }, []);

  // Click outside handler for palettes
  useEffect(() => {
    const handleClickOutside = (event) => {
      const colorPalette = document.getElementById("colorPalette");
      const highlightPalette = document.getElementById("highlightPalette");

      if (
        colorPalette &&
        !colorPalette.contains(event.target) &&
        !event.target.closest("[title='Select text color']")
      ) {
        colorPalette.classList.add("hidden");
      }

      if (
        highlightPalette &&
        !highlightPalette.contains(event.target) &&
        !event.target.closest("[title='Select highlight color']")
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