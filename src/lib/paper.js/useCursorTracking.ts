"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket } from "./socket-client";
import type { ClientToServerEvents, ServerToClientEvents, CursorPositionData } from "./types";

interface UseCursorTrackingOptions {
  roomId: string | undefined;
  editorRef: React.RefObject<HTMLDivElement | null>;
  clientId: string;
  username: string;
}

interface RemoteCursor {
  clientId: string;
  username: string;
  x: number;
  y: number;
  offset: number;
  lastUpdate: number;
}

export function useCursorTracking({
  roomId,
  editorRef,
  clientId,
  username,
}: UseCursorTrackingOptions) {
  const { socket, isConnected } = useSocket(roomId);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPositionRef = useRef<{ offset: number; x: number; y: number } | null>(null);

  // Fonction pour obtenir la position du curseur dans l'éditeur
  const getCursorPosition = useCallback((): { offset: number; x: number; y: number } | null => {
    if (!editorRef.current) return null;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const editor = editorRef.current;

    // Vérifier que le curseur est dans l'éditeur
    if (!editor.contains(range.commonAncestorContainer)) {
      return null;
    }

    // Calculer l'offset du curseur dans le texte
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editor);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const offset = preCaretRange.toString().length;

    // Obtenir la position visuelle du curseur
    const rect = range.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();

    // Si le curseur est invisible (fin de ligne ou élément vide), créer un marqueur temporaire
    let x = rect.left - editorRect.left;
    let y = rect.top - editorRect.top;

    if (rect.width === 0 || rect.height === 0) {
      try {
        const tempSpan = document.createElement('span');
        tempSpan.textContent = '\u200b'; // Zero-width space
        tempSpan.style.position = 'absolute';
        tempSpan.style.visibility = 'hidden';
        range.insertNode(tempSpan);
        const tempRect = tempSpan.getBoundingClientRect();
        x = tempRect.left - editorRect.left;
        y = tempRect.top - editorRect.top;
        tempSpan.remove();
      } catch (e) {
        // Si l'insertion échoue, utiliser la position par défaut
      }
    }

    return { offset, x, y };
  }, [editorRef]);

  // Fonction pour envoyer la position du curseur
  const sendCursorPosition = useCallback(() => {
    if (!socket || !roomId || !isConnected) return;

    const position = getCursorPosition();
    if (!position) return;

    // Éviter d'envoyer trop souvent si la position n'a pas changé
    if (
      lastCursorPositionRef.current &&
      lastCursorPositionRef.current.offset === position.offset &&
      Math.abs(lastCursorPositionRef.current.x - position.x) < 2 &&
      Math.abs(lastCursorPositionRef.current.y - position.y) < 2
    ) {
      return;
    }

    lastCursorPositionRef.current = position;

    const cursorData: CursorPositionData = {
      clientId,
      username,
      offset: position.offset,
      x: position.x,
      y: position.y,
      ts: Date.now(),
    };

    socket.emit('cursor-position', roomId, cursorData);
  }, [socket, roomId, isConnected, clientId, username, getCursorPosition]);

  // Écouter les événements de mouvement du curseur
  useEffect(() => {
    if (!editorRef.current || !roomId) return;

    const editor = editorRef.current;

    const handleCursorMove = () => {
      // Délai pour éviter trop d'envois
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }

      cursorUpdateTimeoutRef.current = setTimeout(() => {
        sendCursorPosition();
      }, 50); // Envoyer toutes les 50ms max
    };

    // Écouter les événements de mouvement du curseur
    editor.addEventListener('keyup', handleCursorMove);
    editor.addEventListener('click', handleCursorMove);
    editor.addEventListener('mouseup', handleCursorMove);

    // Écouter aussi les changements de sélection (pour les flèches, etc.)
    document.addEventListener('selectionchange', handleCursorMove);

    return () => {
      editor.removeEventListener('keyup', handleCursorMove);
      editor.removeEventListener('click', handleCursorMove);
      editor.removeEventListener('mouseup', handleCursorMove);
      document.removeEventListener('selectionchange', handleCursorMove);
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
    };
  }, [editorRef, roomId, sendCursorPosition]);

  // Écouter les positions de curseur des autres utilisateurs
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleCursorPosition: ServerToClientEvents['cursor-position'] = (data) => {
      // Ignorer notre propre curseur
      if (data.clientId === clientId) return;

      setRemoteCursors((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.clientId, {
          clientId: data.clientId,
          username: data.username,
          x: data.x,
          y: data.y,
          offset: data.offset,
          lastUpdate: data.ts,
        });
        return newMap;
      });
    };

    socket.on('cursor-position', handleCursorPosition);

    return () => {
      socket.off('cursor-position', handleCursorPosition);
    };
  }, [socket, roomId, clientId]);

  // Les curseurs ne sont supprimés que quand l'utilisateur quitte le document (via l'événement user-left)

  // Nettoyer les curseurs quand un utilisateur quitte
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleUserLeft: ServerToClientEvents['user-left'] = (userId) => {
      setRemoteCursors((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    };

    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, roomId]);

  return { remoteCursors };
}

