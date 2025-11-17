"use client";

// Utilitaire commun pour ajuster une position de curseur (offset) lorsque le texte change.
// Utilisé à la fois pour le curseur local (dans EditorEffects) et pour les curseurs distants (CursorOverlay).
export function adjustCursorPositionForTextChange(
  oldText: string,
  newText: string,
  cursorPos: number
): number {
  // Normaliser les textes (sauts de ligne, etc.)
  const normalize = (text: string) =>
    text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const oldNorm = normalize(oldText);
  const newNorm = normalize(newText);

  // Si les textes sont identiques, l'offset ne change pas
  if (oldNorm === newNorm) {
    return cursorPos;
  }

  // Borner la position du curseur à l'ancien texte
  const clampedPos = Math.max(0, Math.min(cursorPos, oldNorm.length));

  // Préfixe commun le plus long (début identique)
  let prefixLength = 0;
  const minLength = Math.min(oldNorm.length, newNorm.length);
  while (
    prefixLength < minLength &&
    oldNorm[prefixLength] === newNorm[prefixLength]
  ) {
    prefixLength++;
  }

  // Si le curseur est avant la première différence, on ne le bouge pas
  if (clampedPos <= prefixLength) {
    return clampedPos;
  }

  // Suffixe commun le plus long (fin identique)
  let suffixLength = 0;
  const maxSuffixCheck = Math.min(
    oldNorm.length - prefixLength,
    newNorm.length - prefixLength
  );

  while (
    suffixLength < maxSuffixCheck &&
    oldNorm[oldNorm.length - 1 - suffixLength] ===
      newNorm[newNorm.length - 1 - suffixLength]
  ) {
    suffixLength++;
  }

  // Bornes de la zone modifiée
  const oldChangeStart = prefixLength;
  const oldChangeEnd = oldNorm.length - suffixLength;
  const newChangeStart = prefixLength;
  const newChangeEnd = newNorm.length - suffixLength;

  // Différence de taille dans la zone modifiée
  const oldChangeLength = Math.max(0, oldChangeEnd - oldChangeStart);
  const newChangeLength = Math.max(0, newChangeEnd - newChangeStart);
  const changeDelta = newChangeLength - oldChangeLength;

  // Ajuster en fonction de la position du curseur
  if (clampedPos <= oldChangeStart) {
    // Avant la zone modifiée → pas de changement
    return clampedPos;
  } else if (clampedPos >= oldChangeEnd) {
    // Après la zone modifiée → on décale de la différence
    const adjusted = clampedPos + changeDelta;
    return Math.max(0, Math.min(adjusted, newNorm.length));
  } else {
    // Dans la zone modifiée → on le place au début de la nouvelle zone
    return newChangeStart;
  }
}


