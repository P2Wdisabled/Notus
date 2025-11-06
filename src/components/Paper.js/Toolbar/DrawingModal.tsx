"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Modal from "@/components/ui/modal";

const ClientOnlyDrawingCanvas = dynamic(() => import("./ClientOnlyDrawingCanvas"), { ssr: false });

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormatChange: (command: string, value: string) => void;
}

export default function DrawingModal({ isOpen, onClose, onFormatChange }: DrawingModalProps) {
  const canvasCtrlRef = useRef<any>(null);
  const drawingModalContentRef = useRef<HTMLDivElement>(null);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [drawingState, setDrawingState] = useState({ color: "#000000", size: 3, opacity: 1 });

  // Ensure canvas is cleared every time the modal opens
  useEffect(() => {
    if (isOpen) {
      // reset parent drawings state
      setDrawings([]);
      // If controller already available, clear canvas immediately
      const ctrl = canvasCtrlRef.current;
      if (ctrl) {
        // prefer atomic clearAndSync if available
        if (typeof ctrl.clearAndSync === 'function') {
          ctrl.clearAndSync();
        } else if (typeof ctrl.clearCanvas === 'function') {
          ctrl.clearCanvas();
        }
      }
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dessiner" size="full" className="sm:max-w-4xl">
      <Modal.Content>
        <div ref={drawingModalContentRef} className="w-full max-h-[80vh] relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
          <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[65vh]">
            <ClientOnlyDrawingCanvas
              mode="draw"
              className="absolute inset-0 w-full h-full"
              drawings={drawings}
              setDrawings={setDrawings}
              drawingState={drawingState}
              setDrawingState={setDrawingState}
              onCanvasReady={(ctrl: any) => {
                canvasCtrlRef.current = ctrl;
                // If modal is already open when canvas mounts, ensure it's cleared
                if (isOpen) {
                  try {
                    if (typeof ctrl.clearAndSync === 'function') ctrl.clearAndSync();
                    else if (typeof ctrl.clearCanvas === 'function') ctrl.clearCanvas();
                  } catch (_e) {
                    // ignore
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <label className="text-sm shrink-0">Couleur</label>
            <input
              type="color"
              value={drawingState.color}
              onChange={(e) => {
                const color = e.target.value;
                setDrawingState((s) => ({ ...s, color }));
                canvasCtrlRef.current?.setDrawingState?.({ color });
              }}
              className="h-9 w-12 p-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm shrink-0">Taille</label>
            <input
              type="range"
              min={1}
              max={24}
              value={drawingState.size}
              onChange={(e) => {
                const size = Number(e.target.value);
                setDrawingState((s) => ({ ...s, size }));
                canvasCtrlRef.current?.setDrawingState?.({ size });
              }}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-8 text-right">{drawingState.size}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm shrink-0">Opacité</label>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={drawingState.opacity}
              onChange={(e) => {
                const opacity = Number(e.target.value);
                setDrawingState((s) => ({ ...s, opacity }));
                canvasCtrlRef.current?.setDrawingState?.({ opacity });
              }}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{Math.round(drawingState.opacity * 100)}%</span>
          </div>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <button
          type="button"
          className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => {
            // Reset
            setDrawings([]);
            canvasCtrlRef.current?.clearCanvas?.();
          }}
        >
          Effacer
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={async () => {
            try {
              const dataUrl = canvasCtrlRef.current?.exportAsDataURL?.();
              if (dataUrl) {
                onFormatChange('insertImage', dataUrl);
                // clear canvas state so reopening shows empty canvas
                setDrawings([]);
                try {
                  const ctrl = canvasCtrlRef.current;
                  if (ctrl) {
                    if (typeof ctrl.clearAndSync === 'function') await ctrl.clearAndSync();
                    else if (typeof ctrl.clearCanvas === 'function') ctrl.clearCanvas();
                  }
                } catch (_e) {
                  // ignore
                }
                onClose();
              }
            } catch (e) {
              console.error(e);
            }
          }}
        >
          Insérer l'image
        </button>
      </Modal.Footer>
    </Modal>
  );
}
