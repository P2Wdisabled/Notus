"use client";
import { useState, useEffect } from "react";

interface MarkdownFormatting {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  code: boolean;
  heading: number;
  list: 'none' | 'bullet' | 'number';
  quote: boolean;
}

interface MarkdownToolbarProps {
  formatting: MarkdownFormatting;
  onFormatChange: (format: keyof MarkdownFormatting, value?: any) => void;
  selectedText?: string;
}

export default function MarkdownToolbar({ formatting, onFormatChange, selectedText = "" }: MarkdownToolbarProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);

  return (
    <div className="bg-transparent text-foreground p-4 flex flex-wrap items-center gap-1">
      {/* Bold */}
      <button
        type="button"
        onClick={() => onFormatChange('bold')}
        className={`p-2 rounded transition-colors ${
          formatting.bold
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
          formatting.italic
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Italique (Ctrl+I)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
        </svg>
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onClick={() => onFormatChange('strikethrough')}
        className={`p-2 rounded transition-colors ${
          formatting.strikethrough
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Barré"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
        </svg>
      </button>

      {/* Code */}
      <button
        type="button"
        onClick={() => onFormatChange('code')}
        className={`p-2 rounded transition-colors ${
          formatting.code
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Code inline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
        </svg>
      </button>

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      {/* Heading */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className={`p-2 rounded transition-colors ${
            formatting.heading > 0
              ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
              : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          }`}
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
                  onFormatChange('heading', 0);
                  setShowHeadingMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                  formatting.heading === 0 ? 'bg-gray-100 dark:bg-gray-600' : ''
                }`}
              >
                Normal
              </button>
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    onFormatChange('heading', level);
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    formatting.heading === level ? 'bg-gray-100 dark:bg-gray-600' : ''
                  }`}
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
          className={`p-2 rounded transition-colors ${
            formatting.list !== 'none'
              ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
              : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
          }`}
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
                  onFormatChange('list', 'none');
                  setShowListMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                  formatting.list === 'none' ? 'bg-gray-100 dark:bg-gray-600' : ''
                }`}
              >
                Aucune liste
              </button>
              <button
                type="button"
                onClick={() => {
                  onFormatChange('list', 'bullet');
                  setShowListMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                  formatting.list === 'bullet' ? 'bg-gray-100 dark:bg-gray-600' : ''
                }`}
              >
                • Liste à puces
              </button>
              <button
                type="button"
                onClick={() => {
                  onFormatChange('list', 'number');
                  setShowListMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                  formatting.list === 'number' ? 'bg-gray-100 dark:bg-gray-600' : ''
                }`}
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
        onClick={() => onFormatChange('quote')}
        className={`p-2 rounded transition-colors ${
          formatting.quote
            ? "bg-orange hover:bg-orange dark:bg-dark-purple dark:hover:bg-dark-purple text-white"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        }`}
        title="Citation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      </button>

      {/* Separator */}
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

      {/* Link */}
      <button
        type="button"
        onClick={() => {
          const url = prompt('URL du lien:');
          if (url) {
            const text = prompt('Texte du lien (optionnel):', selectedText || '');
            const linkText = text || url;
            const markdown = `[${linkText}](${url})`;
            // This would need to be handled by the parent component
            console.log('Link markdown:', markdown);
          }
        }}
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
        onClick={() => {
          const url = prompt('URL de l\'image:');
          if (url) {
            const alt = prompt('Texte alternatif (optionnel):');
            const title = prompt('Titre de l\'image (optionnel):');
            let markdown = `![${alt || ''}](${url})`;
            if (title) {
              markdown += ` "${title}"`;
            }
            // This would need to be handled by the parent component
            console.log('Image markdown:', markdown);
          }
        }}
        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
        title="Image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </button>
    </div>
  );
}
