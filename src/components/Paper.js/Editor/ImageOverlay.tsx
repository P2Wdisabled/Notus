"use client";
import { useRef } from "react";

interface ImageOverlayProps {
  imageOverlayRect: { left: number; top: number; width: number; height: number } | null;
  selectedImage: HTMLImageElement | null;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onImageResize: (newWidthPercent: number) => void;
}

export default function ImageOverlay({ 
  imageOverlayRect, 
  selectedImage, 
  editorRef, 
  onImageResize 
}: ImageOverlayProps) {
  const isImageResizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthPxRef = useRef(0);
  const editorWidthPxRef = useRef(0);

  if (!imageOverlayRect) return null;

  // Ne pas afficher le handle de redimension pour les vidéos
  const isVideo = selectedImage?.tagName === 'VIDEO' || selectedImage?.closest('video');

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
      {/* Right-middle resize handle - masqué pour les vidéos */}
      {!isVideo && (
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
          if (!selectedImage || !editorRef.current) return;
          isImageResizingRef.current = true;
          resizeStartXRef.current = e.clientX;
          resizeStartWidthPxRef.current = selectedImage.getBoundingClientRect().width;
          editorWidthPxRef.current = editorRef.current.getBoundingClientRect().width;
          
          const onMove = (me: MouseEvent) => {
            if (!isImageResizingRef.current || !selectedImage) return;
            const deltaX = me.clientX - resizeStartXRef.current;
            const newWidthPx = Math.max(10, resizeStartWidthPxRef.current + deltaX);
            const percent = Math.round((newWidthPx / Math.max(50, editorWidthPxRef.current)) * 100);
            const clampedPercent = Math.min(100, Math.max(1, percent));
            selectedImage.style.width = `${clampedPercent}%`;
            selectedImage.style.height = 'auto';
            onImageResize(clampedPercent);
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
      )}
    </div>
  );
}
