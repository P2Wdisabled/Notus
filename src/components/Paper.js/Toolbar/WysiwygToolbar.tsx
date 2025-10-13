"use client";
import { useState, useEffect, useCallback } from "react";

interface WysiwygToolbarProps {
  onFormatChange: (command: string, value?: string) => void;
  showDebug?: boolean;
  onToggleDebug?: () => void;
}

export default function WysiwygToolbar({ onFormatChange, showDebug = false, onToggleDebug }: WysiwygToolbarProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [hasLink, setHasLink] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState("transparent");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Check current formatting state
  const checkFormatting = useCallback(() => {
    if (typeof document === "undefined") return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
    
    if (element) {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      
      // Check for strikethrough in various ways
      // Check for strikethrough more thoroughly
      let isStrike = false;
      
      // Check queryCommandState first
      if (document.queryCommandState('strikeThrough')) {
        isStrike = true;
      } else {
        // Check if element or any parent has strikethrough
        let currentElement = element;
        while (currentElement && currentElement !== document.body) {
          if (currentElement.nodeName === 'S' || 
              currentElement.nodeName === 'DEL' || 
              currentElement.nodeName === 'STRIKE' ||
              (currentElement as HTMLElement).style?.textDecoration?.includes('line-through')) {
            isStrike = true;
            break;
          }
          currentElement = currentElement.parentElement;
        }
      }
      
      setIsStrikethrough(isStrike);

      // Check current text color
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
        // Convert rgb to hex
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
        setCurrentColor(hexColor);
      }

      // Check current highlight color
      const backgroundColor = computedStyle.backgroundColor;
      if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
        // Convert rgb to hex
        let hexHighlight = backgroundColor;
        if (backgroundColor.startsWith('rgb')) {
          const rgb = backgroundColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const r = parseInt(rgb[0]);
            const g = parseInt(rgb[1]);
            const b = parseInt(rgb[2]);
            hexHighlight = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
        }
        setCurrentHighlight(hexHighlight);
      } else {
        setCurrentHighlight("transparent");
      }

      // Check undo/redo availability
      setCanUndo(document.queryCommandEnabled('undo'));
      setCanRedo(document.queryCommandEnabled('redo'));
    }
  }, []);

  // Listen for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      checkFormatting();
    };

    // Listen for input changes to update undo/redo states
    const handleInput = () => {
      setTimeout(() => {
        setCanUndo(document.queryCommandEnabled('undo'));
        setCanRedo(document.queryCommandEnabled('redo'));
      }, 10);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('input', handleInput);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('input', handleInput);
    };
  }, [checkFormatting]);

  return (
    <div className="bg-transparent text-foreground p-4 flex flex-wrap items-center gap-1">
      {/* Undo */}
      <button
        type="button"
        onClick={() => {
          if ((window as any).handleWysiwygUndo) {
            (window as any).handleWysiwygUndo();
          } else {
            onFormatChange('undo');
          }
        }}
        disabled={!canUndo}
        className={`p-2 rounded transition-colors ${
          canUndo
            ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
            : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        }`}
        title="Annuler (Ctrl+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
        </svg>
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={() => {
          if ((window as any).handleWysiwygRedo) {
            (window as any).handleWysiwygRedo();
          } else {
            onFormatChange('redo');
          }
        }}
        disabled={!canRedo}
        className={`p-2 rounded transition-colors ${
          canRedo
            ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
            : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        }`}
        title="Rétablir (Ctrl+Y ou Ctrl+Shift+Z)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
        </svg>
      </button>

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      {/* Bold */}
      <button
        type="button"
        onClick={() => onFormatChange('bold')}
        className={`p-2 rounded transition-colors ${
          isBold
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Gras (Ctrl+B)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
        </svg>
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => onFormatChange('italic')}
        className={`p-2 rounded transition-colors ${
          isItalic
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Italique (Ctrl+I)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => onFormatChange('underline')}
        className={`p-2 rounded transition-colors ${
          isUnderline
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Souligné (Ctrl+U)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onClick={() => onFormatChange('strikeThrough')}
        className={`p-2 rounded transition-colors ${
          isStrikethrough
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Barré"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
        </svg>
      </button>

      {/* Text Color */}
      <div className="relative">
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
                  setCurrentColor(color);
                  onFormatChange('foreColor', color);
                  setShowColorPicker(false);
                }}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                title="Sélectionner une couleur"
              />
              <button
                type="button"
                onClick={() => {
                  setCurrentColor("#000000");
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
      <div className="relative">
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
                  setCurrentHighlight(color);
                  onFormatChange('backColor', color);
                  setShowHighlightPicker(false);
                }}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                title="Sélectionner une couleur de surlignage"
              />
              <button
                type="button"
                onClick={() => {
                  setCurrentHighlight("transparent");
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

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      {/* Heading */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          title="Titre"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
          </svg>
        </button>

        {showHeadingMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  onFormatChange('formatBlock', 'div');
                  setShowHeadingMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Normal
              </button>
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    onFormatChange('formatBlock', `h${level}`);
                    setShowHeadingMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  H{level} - {level === 1 ? 'Titre principal' : level === 2 ? 'Sous-titre' : level === 3 ? 'Titre de section' : `Titre niveau ${level}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowListMenu(!showListMenu)}
          className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          title="Liste"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
        </button>

        {showListMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  onFormatChange('insertUnorderedList');
                  setShowListMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                • Liste à puces
              </button>
              <button
                type="button"
                onClick={() => {
                  onFormatChange('insertOrderedList');
                  setShowListMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                1. Liste numérotée
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quote */}
      <button
        type="button"
        onClick={() => onFormatChange('formatBlock', 'blockquote')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Citation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      </button>

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      {/* Alignment */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAlignMenu(!showAlignMenu)}
          className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          title="Alignement"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
          </svg>
        </button>

        {showAlignMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 z-50">
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  onFormatChange('justifyLeft');
                  setShowAlignMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Aligner à gauche
              </button>
              <button
                type="button"
                onClick={() => {
                  onFormatChange('justifyCenter');
                  setShowAlignMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Centrer
              </button>
              <button
                type="button"
                onClick={() => {
                  onFormatChange('justifyRight');
                  setShowAlignMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Aligner à droite
              </button>
              <button
                type="button"
                onClick={() => {
                  onFormatChange('justifyFull');
                  setShowAlignMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Justifier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Indent */}
      <button
        type="button"
        onClick={() => onFormatChange('indent')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Augmenter l'indentation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 5v2h18V5H3z"/>
        </svg>
      </button>

      {/* Outdent */}
      <button
        type="button"
        onClick={() => onFormatChange('outdent')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Diminuer l'indentation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21h18v-2H3v2zM7 8v8l-4-4 4-4zm4 9h10v-2H11v2zM3 5v2h18V5H3z"/>
        </svg>
      </button>

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      {/* Link */}
      <button
        type="button"
        onClick={() => onFormatChange('createLink')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Lien"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      </button>

      {/* Image */}
      <button
        type="button"
        onClick={() => onFormatChange('insertImage')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </button>

      {/* Code */}
      <button
        type="button"
        onClick={() => onFormatChange('insertCode')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Code inline (Ctrl+`)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
      </button>

      {/* Code Block */}
      <button
        type="button"
        onClick={() => onFormatChange('insertCodeBlock')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Bloc de code (Ctrl+Shift+`)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
      </button>

      {/* Quote */}
      <button
        type="button"
        onClick={() => onFormatChange('insertQuote')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Citation (Ctrl+Shift+.)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      </button>

      {/* Horizontal Rule */}
      <button
        type="button"
        onClick={() => onFormatChange('insertHorizontalRule')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Ligne horizontale (Ctrl+Shift+-)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 11h18v2H3z"/>
        </svg>
      </button>


      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onFormatChange('insertCheckbox')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Case à cocher"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </button>

      {/* Checkbox Checked */}
      <button
        type="button"
        onClick={() => onFormatChange('insertCheckboxChecked')}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Case cochée"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </button>

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      {/* Debug Toggle */}
      {onToggleDebug && (
        <button
          type="button"
          onClick={onToggleDebug}
          className={`p-2 rounded transition-colors ${
            showDebug
              ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
              : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          }`}
          title="Afficher/Masquer le debug Markdown"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
        </button>
      )}
    </div>
  );
}
