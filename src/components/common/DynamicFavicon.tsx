"use client";

import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DEFAULT_COLOR } from "@/lib/colorPalette";

/**
 * Composant qui met à jour dynamiquement le favicon en fonction de la couleur principale
 * Génère un SVG favicon avec l'icône de bulle de discussion du logo, colorée selon primaryColor
 */
export default function DynamicFavicon() {
  const { primaryColor } = useTheme();

  useEffect(() => {
    // Utiliser la couleur principale ou la couleur par défaut
    const color = primaryColor || DEFAULT_COLOR;

    // Générer le SVG favicon avec la couleur actuelle
    // Utilise exactement les mêmes paths que l'icône de bulle de discussion du logo
    // L'icône originale est dans un viewBox "0 0 196 56", l'icône va de x:56 à x:93.5, y:9 à y:46.5
    // Zone de l'icône: x:56, y:9, width:37.5, height:37.5
    // Pour remplir 32x32: scale = 32/37.5 ≈ 0.8533, puis translate(-56, -9) pour repositionner
    // Petit padding (1px) pour respecter les bords arrondis: scale = 30/37.5 = 0.8
    const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="transparent" rx="5"/>
      <g transform="translate(1, 1) scale(0.8) translate(-56, -9)">
        <path d="M89.75 9H59.75C57.6875 9 56 10.6875 56 12.75V46.5L63.5 39H89.75C91.8125 39 93.5 37.3125 93.5 35.25V12.75C93.5 10.6875 91.8125 9 89.75 9ZM89.75 35.25H62L59.75 37.5V12.75H89.75V35.25Z" fill="${color}" stroke="${color}" stroke-width="1"/>
        <path d="M59.75 9.125H89.75C91.7435 9.125 93.375 10.7565 93.375 12.75V35.25C93.375 37.2435 91.7435 38.875 89.75 38.875H63.4482L63.4111 38.9111L56.125 46.1973V12.75C56.125 10.7565 57.7565 9.125 59.75 9.125ZM59.625 37.8018L59.8389 37.5889L62.0527 35.375H89.875V12.625H59.625V37.8018Z" stroke="${color}" stroke-width="0.25" fill="none" opacity="0.7"/>
      </g>
    </svg>`.trim();

    // Encoder le SVG en data URL
    const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svgFavicon)}`;

    // Trouver ou créer le lien favicon
    let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      document.head.appendChild(faviconLink);
    }

    // Mettre à jour le href avec le nouveau favicon
    faviconLink.href = svgDataUrl;

    // Mettre à jour aussi apple-touch-icon pour iOS
    let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement("link");
      appleTouchIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = svgDataUrl;
  }, [primaryColor]);

  // Ce composant ne rend rien visuellement
  return null;
}

