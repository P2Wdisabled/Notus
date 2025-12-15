"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface DrawingState {
  color: string;
  size: number;
  opacity: number;
}

interface DrawingsContextType {
  drawings: any[];
  setDrawings: (drawings: any[] | ((prev: any[]) => any[])) => void;
  drawingState: DrawingState;
  setDrawingState: (state: DrawingState | ((prev: DrawingState) => DrawingState) | Partial<DrawingState>) => void;
  resetDrawings: () => void;
}

const DrawingsContext = createContext<DrawingsContextType | undefined>(undefined);

export function DrawingsProvider({ children }: { children: ReactNode }) {
  const [drawings, setDrawings] = useState<any[]>([]);
  const [drawingState, setDrawingStateInternal] = useState<DrawingState>({
    color: "#000000",
    size: 3,
    opacity: 1,
  });

  const setDrawingState = (state: DrawingState | ((prev: DrawingState) => DrawingState) | Partial<DrawingState>) => {
    if (typeof state === 'function') {
      setDrawingStateInternal(state);
    } else {
      setDrawingStateInternal((prev) => ({ ...prev, ...state }));
    }
  };

  const resetDrawings = () => {
    setDrawings([]);
  };

  return (
    <DrawingsContext.Provider
      value={{
        drawings,
        setDrawings,
        drawingState,
        setDrawingState,
        resetDrawings,
      }}
    >
      {children}
    </DrawingsContext.Provider>
  );
}

export function useDrawings() {
  const context = useContext(DrawingsContext);
  if (!context) {
    throw new Error("useDrawings must be used within a DrawingsProvider");
  }
  return context;
}