/**
 * Palette de couleurs prédéfinies pour l'application
 * 12 couleurs soigneusement sélectionnées pour une interface moderne et élégante
 */
export const COLOR_PALETTE = [
  { name: "Violet Dottxt", value: "#A98BFF" }, // Couleur par défaut
  { name: "Bleu", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Rose Notus", value: "#DD05C7" },
  { name: "Rouge Yanotela", value: "#882626" },
  { name: "Orange", value: "#f97316" },
  { name: "Ambre", value: "#f59e0b" },
  { name: "Vert", value: "#10b981" },
  { name: "Émeraude", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sarcelle", value: "#0891b2" },
  { name: "Bleu foncé", value: "#1e40af" },
] as const;

export const DEFAULT_COLOR = COLOR_PALETTE[0].value; // Violet par défaut

export type ColorPaletteItem = (typeof COLOR_PALETTE)[number];

