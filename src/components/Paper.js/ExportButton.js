'use client';

import { useState } from 'react';
import { exportDocument } from '../../lib/paper.js/export';

export default function ExportButton({ content, disabled = false, getRichContent }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [exportError, setExportError] = useState(null);

  const generateFilename = () => {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    return `collaborative-notepad-${timestamp}`;
  };

  const handleExport = async (format) => {
    if (!content.trim()) {
      setExportError('No content to export');
      setTimeout(() => setExportError(null), 3000);
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setShowDropdown(false);

    try {
      // Get rich HTML content if available, otherwise use plain content
      const exportContent = getRichContent ? getRichContent() : content;
      
      await exportDocument({
        content: exportContent,
        filename: generateFilename(),
        format
      });
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || isExporting}
        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
          disabled || isExporting
            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
            : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
        title="Export document"
      >
        {isExporting ? (
          <span className="flex items-center space-x-2">
            <span className="animate-spin">⟳</span>
            <span>Exporting...</span>
          </span>
        ) : (
          '📥 Export'
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && !isExporting && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[160px]">
          <div className="py-1">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>📄</span>
              <span>Export as PDF</span>
            </button>
            <button
              onClick={() => handleExport('docx')}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>📝</span>
              <span>Export as Word</span>
            </button>
            <button
              onClick={() => handleExport('txt')}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <span>📋</span>
              <span>Export as Text</span>
            </button>
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Error Message */}
      {exportError && (
        <div className="absolute top-full right-0 mt-2 bg-red-600 text-white px-3 py-2 rounded text-sm z-50 max-w-[200px]">
          {exportError}
        </div>
      )}
    </div>
  );
}