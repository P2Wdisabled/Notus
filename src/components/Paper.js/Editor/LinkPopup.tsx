"use client";
import { useState, useCallback, useRef, useEffect } from "react";

interface LinkPopupProps {
  visible: boolean;
  x: number;
  y: number;
  url: string;
  onClose: () => void;
}

export default function LinkPopup({ visible, x, y, url, onClose }: LinkPopupProps) {
  const popupTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle popup mouse enter to keep it open
  const handlePopupEnter = useCallback(() => {
    // Clear any existing timeout to keep popup open
    if (popupTimeout.current) {
      clearTimeout(popupTimeout.current);
      popupTimeout.current = null;
    }
  }, []);

  // Handle popup mouse leave to hide popup
  const handlePopupLeave = useCallback((e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isMovingToLink = relatedTarget?.closest('a');
    
    // Only hide if not moving back to a link
    if (!isMovingToLink) {
      // Clear any existing timeout
      if (popupTimeout.current) {
        clearTimeout(popupTimeout.current);
      }
      
      // Hide popup after 1 second
      popupTimeout.current = setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [onClose]);

  // Open link in new tab
  const openLink = useCallback((url: string) => {
    // Clear any existing timeout
    if (popupTimeout.current) {
      clearTimeout(popupTimeout.current);
      popupTimeout.current = null;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  }, [onClose]);

  // Hide popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visible) {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('[data-link-popup]')) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible, onClose]);

  // Monitor cursor position to keep popup open when cursor is in link text
  useEffect(() => {
    const handleSelectionChange = () => {
      if (visible) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const link = range.commonAncestorContainer.parentElement?.closest('a') || 
                      range.startContainer.parentElement?.closest('a');
          
          // If cursor is not in a link, hide popup
          if (!link) {
            onClose();
          }
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [visible, onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (popupTimeout.current) {
        clearTimeout(popupTimeout.current);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      data-link-popup
      className="absolute z-50 bg-card border border-border rounded-lg shadow-lg p-2 pointer-events-auto"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translateX(-50%)',
        minWidth: '120px'
      }}
      onMouseEnter={handlePopupEnter}
      onMouseLeave={handlePopupLeave}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs text-muted-foreground truncate max-w-32">
          {url}
        </span>
        <button
          onClick={() => openLink(url)}
          className="px-2 py-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
        >
          Ouvrir
        </button>
      </div>
    </div>
  );
}
