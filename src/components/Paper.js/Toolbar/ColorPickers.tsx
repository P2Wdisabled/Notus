"use client";
import { useState, useEffect } from "react";

interface ColorPickersProps {
  currentColor: string;
  currentHighlight: string;
  onFormatChange: (command: string, value: string) => void;
}

export default function ColorPickers({ currentColor, currentHighlight, onFormatChange }: ColorPickersProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // Handle clicks outside color pickers to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside color picker containers
      if (showColorPicker && !target.closest('[data-color-picker]')) {
        setShowColorPicker(false);
      }
      
      if (showHighlightPicker && !target.closest('[data-highlight-picker]')) {
        setShowHighlightPicker(false);
      }
    };

    if (showColorPicker || showHighlightPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker, showHighlightPicker]);

  return (
    <>
      {/* Text Color */}
      <div className="relative" data-color-picker>
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          title="Couleur du texte"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.62 12L12 5.67 14.38 12M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2z"/>
          </svg>
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
            style={{ backgroundColor: currentColor }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Couleur du texte
              </label>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  const color = e.target.value;
                  onFormatChange('foreColor', color);
                }}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                title="Sélectionner une couleur"
              />
              <button
                type="button"
                onClick={() => {
                  onFormatChange('foreColor', "#000000");
                  setShowColorPicker(false);
                }}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors"
              >
                Réinitialiser (Noir)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative" data-highlight-picker>
        <button
          type="button"
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          title="Couleur de surlignage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96a.996.996 0 000-1.41L18.37.29a.996.996 0 00-1.41 0L15 2.25 18.75 6l1.96-1.96z"/>
            <path fillOpacity=".36" d="M0 20h24v4H0z"/>
          </svg>
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
            style={{ backgroundColor: currentHighlight === "transparent" ? "#ffff00" : currentHighlight }}
          />
        </button>

        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Couleur de surlignage
              </label>
              <input
                type="color"
                value={currentHighlight === "transparent" ? "#ffff00" : currentHighlight}
                onChange={(e) => {
                  const color = e.target.value;
                  onFormatChange('backColor', color);
                }}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                title="Sélectionner une couleur de surlignage"
              />
              <button
                type="button"
                onClick={() => {
                  onFormatChange('backColor', "transparent");
                  setShowHighlightPicker(false);
                }}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors"
              >
                Supprimer le surlignage
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
