"use client";
import { useRef } from "react";

interface ImageOverlayProps {
  imageOverlayRect: { left: number; top: number; width: number; height: number } | null;
  selectedElement: HTMLElement | null;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onElementResize: (newWidthPercent: number) => void;
}

export default function ImageOverlay({ 
  imageOverlayRect, 
  selectedElement, 
  editorRef, 
  onElementResize 
}: ImageOverlayProps) {
  const isImageResizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthPxRef = useRef(0);
  const editorWidthPxRef = useRef(0);

  if (!imageOverlayRect) return null;

  const isImage = selectedElement?.tagName === 'IMG';
  const isVideo = selectedElement?.tagName === 'VIDEO';

  return (
    <div
      className="pointer-events-none"
      style={{ 
        position: 'absolute', 
        left: imageOverlayRect.left, 
        top: imageOverlayRect.top, 
        width: imageOverlayRect.width, 
        height: imageOverlayRect.height 
      }}
    >
      <div
        role="button"
        className="pointer-events-auto"
        style={{
          position: 'absolute',
          top: '50%',
          left: imageOverlayRect.width - 4,
          width: 8,
          height: 8,
          background: '#3b82f6',
          borderRadius: 2,
          transform: 'translateY(-50%)',
          cursor: 'ew-resize',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          if (!selectedElement || !editorRef.current) return;
          isImageResizingRef.current = true;
          resizeStartXRef.current = e.clientX;
          resizeStartWidthPxRef.current = selectedElement.getBoundingClientRect().width;
          editorWidthPxRef.current = editorRef.current.getBoundingClientRect().width;
          
          const onMove = (me: MouseEvent) => {
            if (!isImageResizingRef.current || !selectedElement) return;
            const deltaX = me.clientX - resizeStartXRef.current;
            const newWidthPx = Math.max(10, resizeStartWidthPxRef.current + deltaX);
            const percent = Math.round((newWidthPx / Math.max(50, editorWidthPxRef.current)) * 100);
            const clampedPercent = Math.min(100, Math.max(1, percent));
            selectedElement.style.width = `${clampedPercent}%`;
            if (isImage || isVideo) {
              (selectedElement as HTMLElement).style.height = 'auto';
            }
            onElementResize(clampedPercent);
          };
          
          const onUp = () => {
            if (!isImageResizingRef.current) return;
            isImageResizingRef.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      />
    </div>
  );
}
