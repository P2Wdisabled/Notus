"use client";

import DiffMatchPatch from "diff-match-patch";

// Utilitaire commun pour ajuster une position de curseur (offset) lorsque le texte change.
// Utilisé à la fois pour le curseur local (dans EditorEffects) et pour les curseurs distants (CursorOverlay).
export function adjustCursorPositionForTextChange(
  oldText: string,
  newText: string,
  cursorPos: number
): number {
  const normalize = (text: string) =>
    text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const oldNorm = normalize(oldText);
  const newNorm = normalize(newText);

  if (oldNorm === newNorm) {
    return cursorPos;
  }

  const clampedPos = Math.max(0, Math.min(cursorPos, oldNorm.length));

  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(oldNorm, newNorm, false);
  dmp.diff_cleanupEfficiency(diffs);

  const mappedOffset = dmp.diff_xIndex(diffs, clampedPos);
  const boundedOffset = Math.max(0, Math.min(mappedOffset, newNorm.length));

  return boundedOffset;
}

