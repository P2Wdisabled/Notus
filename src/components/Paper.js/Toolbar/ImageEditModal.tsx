"use client";
import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/modal";

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormatChange: (command: string, value: string) => void;
  canEditImage: boolean;
  imageInfo: { src: string; naturalWidth: number; naturalHeight: number; styleWidth: string; styleHeight: string } | null;
}

export default function ImageEditModal({ 
  isOpen, 
  onClose, 
  onFormatChange, 
  canEditImage, 
  imageInfo 
}: ImageEditModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [widthPercent, setWidthPercent] = useState<number>(100);

  // Crop interactions
  const getRelativePos = (clientX: number, clientY: number) => {
    const container = cropContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
    const y = Math.min(Math.max(0, clientY - rect.top), rect.height);
    return { x, y };
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCropping(true);
    const p = getRelativePos(e.clientX, e.clientY);
    setCropStart(p);
    setCropRect({ x: p.x, y: p.y, width: 0, height: 0 });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isCropping || !cropStart || !cropContainerRef.current) return;
    const p = getRelativePos(e.clientX, e.clientY);
    const x = Math.min(cropStart.x, p.x);
    const y = Math.min(cropStart.y, p.y);
    const width = Math.abs(p.x - cropStart.x);
    const height = Math.abs(p.y - cropStart.y);
    setCropRect({ x, y, width, height });
  };

  const handleCropMouseUp = (e: React.MouseEvent) => {
    if (!isCropping) return;
    e.preventDefault();
    setIsCropping(false);
  };

  const resetCrop = () => {
    // Default to full image area when opening
    const container = cropContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setCropRect({ x: 0, y: 0, width: rect.width, height: rect.height });
    setCropStart({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (isOpen) {
      // Give layout a tick, then set full crop
      const t = setTimeout(() => resetCrop(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const applyResizeOnly = () => {
    try {
      onFormatChange('setImageWidth', JSON.stringify({ widthPercent }));
      onClose();
    } catch (_e) {
      onFormatChange('setImageWidth', String(widthPercent));
      onClose();
    }
  };

  const applyCropAndReplace = async () => {
    if (!imageInfo || !imageRef.current || !cropContainerRef.current) return;
    const imgEl = imageRef.current;
    const dispRect = cropContainerRef.current.getBoundingClientRect();
    const sel = cropRect && cropRect.width > 0 && cropRect.height > 0
      ? cropRect
      : { x: 0, y: 0, width: dispRect.width, height: dispRect.height };
    // Map displayed selection to natural pixels
    const scaleX = imageInfo.naturalWidth / dispRect.width;
    const scaleY = imageInfo.naturalHeight / dispRect.height;
    const sx = Math.round(sel.x * scaleX);
    const sy = Math.round(sel.y * scaleY);
    const sw = Math.max(1, Math.round(sel.width * scaleX));
    const sh = Math.max(1, Math.round(sel.height * scaleY));
    // Draw to canvas
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const tmpImg = new Image();
    // Ensure CORS-safe data URLs and same-origin URLs
    tmpImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      tmpImg.onload = () => resolve();
      tmpImg.onerror = () => reject();
      tmpImg.src = imageInfo.src;
    }).catch(() => {});
    try {
      ctx.drawImage(tmpImg, sx, sy, sw, sh, 0, 0, sw, sh);
      const dataUrl = canvas.toDataURL('image/png');
      onFormatChange('replaceSelectedImage', JSON.stringify({ src: dataUrl, widthPercent }));
      onClose();
    } catch (_e) {
      // Fallback: just set width
      applyResizeOnly();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier l'image" size="lg">
      <Modal.Content>
        {imageInfo ? (
          <div className="space-y-4">
            <div
              ref={cropContainerRef}
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              className="relative w-full max-h-[60vh] overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
              style={{ aspectRatio: `${imageInfo.naturalWidth}/${imageInfo.naturalHeight}` } as any}
            >
              <img
                ref={imageRef}
                src={imageInfo.src}
                alt="selected"
                className="w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
              {cropRect && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/10"
                  style={{ left: `${cropRect.x}px`, top: `${cropRect.y}px`, width: `${cropRect.width}px`, height: `${cropRect.height}px` }}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm">Largeur d'affichage</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={widthPercent}
                  onChange={(e) => setWidthPercent(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs w-12 text-right">{widthPercent}%</span>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setWidthPercent(100)}
                >
                  100%
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Astuce: cliquez-glissez sur l'image pour définir la zone à recadrer.</span>
              <button type="button" className="underline" onClick={resetCrop}>Sélection complète</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-300">Aucune image sélectionnée.</div>
        )}
      </Modal.Content>
      <Modal.Footer>
        <button
          type="button"
          className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={onClose}
        >
          Annuler
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={applyResizeOnly}
          disabled={!canEditImage}
        >
          Appliquer la largeur
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={applyCropAndReplace}
          disabled={!canEditImage}
        >
          Recadrer et remplacer
        </button>
      </Modal.Footer>
    </Modal>
  );
}
