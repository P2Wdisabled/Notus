"use client";
import React, { useEffect, useMemo, useState } from "react";

interface RemoteCursor {
  clientId: string;
  username: string;
  x: number;
  y: number;
  offset: number;
  lastUpdate: number;
}

interface CursorOverlayProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  remoteCursors: Map<string, RemoteCursor>;
}

// Générer une couleur basée sur le clientId pour avoir des couleurs cohérentes
function getColorForClientId(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Générer une couleur pastel
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

// Calculer la position (x, y) à partir d'un offset de texte dans l'éditeur
function getPositionFromOffset(editor: HTMLDivElement, offset: number): { x: number; y: number } | null {
  try {
    if (!editor.hasChildNodes() || editor.textContent === '') {
      const editorRect = editor.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(editor);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      return { x: paddingLeft, y: paddingTop };
    }

    const range = document.createRange();
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentOffset = 0;
    let textNode: Node | null = null;
    let nodeOffset = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const nodeLength = node.textContent.length;
        if (currentOffset + nodeLength >= offset) {
          textNode = node;
          nodeOffset = offset - currentOffset;
          break;
        }
        currentOffset += nodeLength;
      }
    }

    if (!textNode) {
      const allTextNodes: Node[] = [];
      const textWalker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node: Node | null;
      while ((node = textWalker.nextNode())) {
        allTextNodes.push(node);
      }
      
      if (allTextNodes.length > 0) {
        textNode = allTextNodes[allTextNodes.length - 1];
        nodeOffset = textNode.textContent?.length || 0;
      } else {
        const editorRect = editor.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(editor);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        return { x: paddingLeft, y: paddingTop + editorRect.height - paddingTop * 2 };
      }
    }

    if (textNode && textNode.textContent !== null) {
      const safeOffset = Math.min(Math.max(0, nodeOffset), textNode.textContent.length);
      
      range.setStart(textNode, safeOffset);
      range.setEnd(textNode, safeOffset);

      const rect = range.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();

      let x = rect.left - editorRect.left;
      let y = rect.top - editorRect.top;

      if (rect.width === 0 || rect.height === 0) {
        try {
          const tempSpan = document.createElement('span');
          tempSpan.textContent = '\u200b';
          tempSpan.style.position = 'absolute';
          tempSpan.style.visibility = 'hidden';
          range.insertNode(tempSpan);
          const tempRect = tempSpan.getBoundingClientRect();
          x = tempRect.left - editorRect.left;
          y = tempRect.top - editorRect.top;
          tempSpan.remove();
        } catch (e) {
          // Fallback: utiliser une range pour obtenir la position du nœud texte
          const fallbackRange = document.createRange();
          fallbackRange.selectNodeContents(textNode);
          const nodeRect = fallbackRange.getBoundingClientRect();
          x = nodeRect.left - editorRect.left;
          y = nodeRect.top - editorRect.top;
        }
      }

      return { x, y };
    }
  } catch (e) {
    console.error('Erreur lors du calcul de la position du curseur:', e);
  }

  return null;
}

export default function CursorOverlay({ editorRef, remoteCursors }: CursorOverlayProps) {
  const [contentVersion, setContentVersion] = useState(0);
  const [hoveredCursor, setHoveredCursor] = useState<string | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const observer = new MutationObserver(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setContentVersion(prev => prev + 1);
      }, 50);
    });

    observer.observe(editor, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [editorRef]);

  const cursorsWithPositions = useMemo(() => {
    if (!editorRef.current || remoteCursors.size === 0) {
      return [];
    }

    const editor = editorRef.current;
    const result: Array<{
      cursor: RemoteCursor;
      position: { x: number; y: number } | null;
      color: string;
    }> = [];

    remoteCursors.forEach((cursor) => {
      const position = editor ? getPositionFromOffset(editor, cursor.offset) : null;
      const color = getColorForClientId(cursor.clientId);
      result.push({ cursor, position, color });
    });

    return result;
  }, [editorRef, remoteCursors, contentVersion]);

  if (!editorRef.current || cursorsWithPositions.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {cursorsWithPositions.map(({ cursor, position, color }) => {
        if (!position) {
          return null;
        }

        const isHovered = hoveredCursor === cursor.clientId;

        return (
          <div
            key={cursor.clientId}
            className="absolute z-50"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => setHoveredCursor(cursor.clientId)}
            onMouseLeave={() => setHoveredCursor(null)}
          >
            {/* Pseudo au-dessus - affiché uniquement au hover */}
            {isHovered && (
              <div
                className="absolute bottom-full mb-1 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg pointer-events-none"
                style={{
                  backgroundColor: color,
                  transform: 'translateX(-50%)',
                  left: '50%',
                }}
              >
                {cursor.username || 'Utilisateur'}
              </div>
            )}
            
            {/* Barre verticale du curseur */}
            <div
              className="w-0.5 h-5 pointer-events-none"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 4px ${color}`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

