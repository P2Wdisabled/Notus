"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SelectionContextType {
  isSelectModeActive: boolean;
  setIsSelectModeActive: (active: boolean) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [isSelectModeActive, setIsSelectModeActive] = useState(false);

  return (
    <SelectionContext.Provider value={{ isSelectModeActive, setIsSelectModeActive }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
