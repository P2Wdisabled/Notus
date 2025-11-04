"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  primaryColor: string;
  setPrimaryColor: (hexColor: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string>("");

  useEffect(() => {
    // Vérifier la préférence système au chargement
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const hasManualOverride = localStorage.getItem("theme");
    
    if (hasManualOverride) {
      const manualTheme = localStorage.getItem("theme") === "dark";
      setIsDark(manualTheme);
      if (manualTheme) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Utiliser la préférence système
      setIsDark(isSystemDark);
      if (isSystemDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // Écouter les changements de préférence système seulement si pas de surcharge manuelle
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        if (e.matches) {
          document.documentElement.classList.add("dark");
          setIsDark(true);
        } else {
          document.documentElement.classList.remove("dark");
          setIsDark(false);
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Applique la couleur principale aux variables CSS pertinentes
  const applyPrimaryColor = (hexColor: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", hexColor);
    root.style.setProperty("--accent", hexColor);
    root.style.setProperty("--ring", hexColor);
    root.style.setProperty("--sidebar-primary", hexColor);
  };

  // Charger la couleur principale sauvegardée
  useEffect(() => {
    const saved = localStorage.getItem("primaryColor");
    if (saved) {
      setPrimaryColor(saved);
      applyPrimaryColor(saved);
    }
  }, []);

  const updatePrimaryColor = (hexColor: string) => {
    setPrimaryColor(hexColor);
    localStorage.setItem("primaryColor", hexColor);
    applyPrimaryColor(hexColor);
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    // Sauvegarder la préférence manuelle
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, primaryColor, setPrimaryColor: updatePrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
