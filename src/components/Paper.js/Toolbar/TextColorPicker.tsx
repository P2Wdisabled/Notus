import { useState, useEffect } from 'react';

interface TextFormatting {
  color?: string;
  [key: string]: any;
}

interface TextColorPickerProps {
  textFormatting: TextFormatting;
  setTextFormatting: (formatting: TextFormatting) => void;
  applyFormat: (command: string, value?: string) => void;
}

export default function TextColorPicker({
  textFormatting,
  setTextFormatting,
  applyFormat,
}: TextColorPickerProps) {
  const [currentColor, setCurrentColor] = useState<string>("#000000");

  // Update current color when textFormatting changes
  useEffect(() => {
    setCurrentColor(textFormatting.color || "#000000");
  }, [textFormatting.color]);

  // Listen for selection changes to update color automatically
  useEffect(() => {
    const handleSelectionChange = () => {
      const detectedColor = getCurrentColor();
      if (detectedColor !== currentColor) {
        setCurrentColor(detectedColor);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [currentColor]);

  const getCurrentColor = (): string => {
    // Get text color from selection or cursor position
    const selection = window.getSelection();
    let elementToCheck: Element | null = null;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedNode = range.startContainer;

      if (selectedNode.nodeType === 3) {
        // Text node - get parent element
        elementToCheck = selectedNode.parentElement;
      } else if (selectedNode.nodeType === 1) {
        // Element node
        if (range.startOffset > 0 && (selectedNode as Element).childNodes.length > 0) {
          // Check the node before the cursor
          const childNode = (selectedNode as Element).childNodes[range.startOffset - 1];
          elementToCheck = childNode.nodeType === 3 
            ? (childNode.parentElement as Element)
            : (childNode as Element);
        } else {
          elementToCheck = selectedNode as Element;
        }
      }

      // If we have an element, check its color
      if (elementToCheck) {
        const computedStyle = window.getComputedStyle(elementToCheck);
        const color = computedStyle.color;
        
        // Convert rgb to hex if needed
        if (color && color !== "rgb(0, 0, 0)" && color !== "rgba(0, 0, 0, 0)") {
          let hexColor = color;
          if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
          }
          
          // Update state to match what we see
          if (hexColor !== textFormatting.color) {
            setTimeout(
              () =>
                setTextFormatting((prev: any) => ({
                  ...prev,
                  color: hexColor,
                })),
              0
            );
          }
          return hexColor;
        }
      }
    }

    // Default to black when no selection or no color detected
    return textFormatting.color || "#000000";
  };

  return (
    <div className="flex items-center relative">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            // Hide highlight palette if it's open
            document
              .getElementById("highlightPalette")
              ?.classList.add("hidden");
            // Toggle color palette
            const colorPalette = document.getElementById("colorPalette");
            colorPalette?.classList.toggle("hidden");
            
            // Update color picker with current color when opening
            if (colorPalette && !colorPalette.classList.contains("hidden")) {
              const colorInput = colorPalette.querySelector('input[type="color"]') as HTMLInputElement;
              if (colorInput) {
                // Use the current color from state, which should be up to date
                colorInput.value = currentColor;
              }
            }
          }}
          className="p-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all hover:shadow-md relative"
          title="Select text color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-current" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.62 12L12 5.67 14.38 12M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2z"/>
          </svg>
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        <div
          id="colorPalette"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-700 rounded shadow-lg hidden z-50 border border-gray-200 dark:border-gray-600"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Choisir une couleur
            </label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                const color = e.target.value;
                setCurrentColor(color);
                setTextFormatting({ ...textFormatting, color });
                applyFormat("foreColor", color);
              }}
              className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              title="Sélectionner une couleur"
            />
            <button
              type="button"
              onClick={() => {
                setCurrentColor("#000000");
                setTextFormatting({ ...textFormatting, color: "#000000" });
                applyFormat("foreColor", "#000000");
                document
                  .getElementById("colorPalette")
                  ?.classList.add("hidden");
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors"
            >
              Réinitialiser (Noir)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

