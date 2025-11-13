import { useRef, useCallback } from "react";

interface HistoryState {
  markdown: string;
  timestamp: number;
}

export function useUndoRedoHistory(maxHistorySize: number = 50) {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const isUndoingRef = useRef<boolean>(false);
  const isRedoingRef = useRef<boolean>(false);

  // Save a state to history
  const saveState = useCallback((markdown: string) => {
    // Don't save if we're in the middle of undo/redo
    if (isUndoingRef.current || isRedoingRef.current) {
      return;
    }

    const newState: HistoryState = {
      markdown,
      timestamp: Date.now()
    };

    // Remove any states after current index (when user makes a new change after undo)
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(newState);

    // Limit history size
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current = historyRef.current.length - 1;
    }
  }, [maxHistorySize]);

  // Undo: go back to previous state
  const undo = useCallback((): string | null => {
    if (currentIndexRef.current <= 0) {
      return null; // No history to undo
    }

    isUndoingRef.current = true;
    currentIndexRef.current--;
    const state = historyRef.current[currentIndexRef.current];
    
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);

    return state ? state.markdown : null;
  }, []);

  // Redo: go forward to next state
  const redo = useCallback((): string | null => {
    if (currentIndexRef.current >= historyRef.current.length - 1) {
      return null; // No history to redo
    }

    isRedoingRef.current = true;
    currentIndexRef.current++;
    const state = historyRef.current[currentIndexRef.current];
    
    setTimeout(() => {
      isRedoingRef.current = false;
    }, 0);

    return state ? state.markdown : null;
  }, []);

  // Check if undo is available
  const canUndo = useCallback((): boolean => {
    return currentIndexRef.current > 0;
  }, []);

  // Check if redo is available
  const canRedo = useCallback((): boolean => {
    return currentIndexRef.current < historyRef.current.length - 1;
  }, []);

  // Initialize history with initial state
  const initialize = useCallback((initialMarkdown: string) => {
    historyRef.current = [{
      markdown: initialMarkdown,
      timestamp: Date.now()
    }];
    currentIndexRef.current = 0;
  }, []);

  // Clear history
  const clear = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    initialize,
    clear
  };
}

