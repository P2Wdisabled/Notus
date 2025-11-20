"use client";
import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "./socket-client";
import type {
  PersistedContentSnapshot,
  ServerToClientEvents,
  SocketAckResponse,
  TextUpdateData,
} from "./types";

type SyncStatus = 'synchronized' | 'saving' | 'unsynchronized';

interface UseCollaborativeNoteOptions {
  roomId: string | undefined;
  onRemoteContent: (content: string) => void;
  metadata?: {
    documentId?: string;
    userId?: number;
    userEmail?: string;
    title?: string;
    tags?: string[];
    getContentSnapshot?: () => PersistedContentSnapshot | null;
    cursorUsername?: string;
  };
  getCursorSnapshot?: () => { offset: number; x: number; y: number } | null;
  onSyncStatusChange?: (status: SyncStatus) => void;
  onPersisted?: (payload: { snapshot?: PersistedContentSnapshot | null; title?: string; tags?: string[] }) => void;
}

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useCollaborativeNote({
  roomId,
  onRemoteContent,
  metadata,
  getCursorSnapshot,
  onSyncStatusChange,
  onPersisted,
}: UseCollaborativeNoteOptions) {
  const clientIdRef = useRef<string>(generateClientId());
  const {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
  } = useSocket(roomId);
  const pendingMarkdownRef = useRef<string>("");
  const lastObservedMarkdownRef = useRef<string>("");
  const pendingCharsRef = useRef<number>(0);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<SyncStatus>('synchronized');

  const updateStatus = useCallback((status: SyncStatus) => {
    if (statusRef.current === status) return;
    statusRef.current = status;
    onSyncStatusChange?.(status);
  }, [onSyncStatusChange]);

  const buildContentSnapshot = useCallback(
    (override?: PersistedContentSnapshot | null) => {
      if (override) return override;
      if (metadata?.getContentSnapshot) {
        return metadata.getContentSnapshot();
      }
      return {
        text: pendingMarkdownRef.current || "",
        timestamp: Date.now(),
      };
    },
    [metadata]
  );

  const flushPendingChanges = useCallback(
    async (override?: {
      markdown?: string;
      contentSnapshot?: PersistedContentSnapshot | null;
      title?: string;
      tags?: string[];
    }) => {
      if (!socket || !roomId) return;
      const candidateMarkdown =
        typeof override?.markdown === "string" ? override.markdown : pendingMarkdownRef.current;

      const snapshot = buildContentSnapshot(override?.contentSnapshot);
      const contentString =
        typeof candidateMarkdown === "string" && candidateMarkdown.length > 0
          ? candidateMarkdown
          : snapshot?.text ?? '';

      if (typeof contentString !== "string") {
        return;
      }

      if (contentString.length === 0 && !snapshot) {
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        updateStatus('unsynchronized');
        return;
      }

      const cursor = getCursorSnapshot?.();

      const payload: TextUpdateData = {
        content: contentString,
        clientId: clientIdRef.current,
        ts: Date.now(),
        documentId: metadata?.documentId,
        userId: metadata?.userId,
        userEmail: metadata?.userEmail,
        title: override?.title ?? metadata?.title,
        tags: override?.tags ?? metadata?.tags,
        persistSnapshot: snapshot || undefined,
        cursor: cursor
          ? {
              clientId: clientIdRef.current,
              username: metadata?.cursorUsername || clientIdRef.current,
              offset: cursor.offset,
              x: cursor.x,
              y: cursor.y,
              ts: Date.now(),
            }
          : undefined,
      };

      updateStatus('saving');

      return new Promise<void>((resolve) => {
        const ackCallback = (ack?: SocketAckResponse) => {
          if (!ack || ack.ok) {
            pendingCharsRef.current = 0;
            updateStatus('synchronized');
            if (snapshot) {
              onPersisted?.({
                snapshot,
                title: payload.title,
                tags: payload.tags,
              });
            }
          } else {
            updateStatus('unsynchronized');
          }
          resolve();
        };

        if (payload.cursor) {
          socket.emit('text-update-with-cursor', roomId, payload, ackCallback);
        } else {
          socket.emit('text-update', roomId, payload, ackCallback);
        }
      });
    },
    [socket, roomId, buildContentSnapshot, getCursorSnapshot, metadata, onPersisted, updateStatus]
  );

  useEffect(() => {
    if (!socket || !roomId) return;

      const handleTextUpdate: ServerToClientEvents['text-update'] = (data) => {
        // Ignore own updates using clientId
        if (data.clientId && data.clientId === clientIdRef.current) {
          return;
        }
        if (typeof data.content === 'string') {
          onRemoteContent(data.content);
        }
      };

    socket.on('text-update', handleTextUpdate);

    return () => {
      socket.off('text-update', handleTextUpdate);
    };
  }, [socket, roomId, onRemoteContent]);

  useEffect(() => {
    if (!socket || !roomId) return;
    joinRoom(roomId);
    return () => leaveRoom(roomId);
  }, [socket, roomId, joinRoom, leaveRoom]);

  const emitLocalChange = useCallback(
    (markdown: string) => {
      if (!roomId || !socket) return;
      pendingMarkdownRef.current = markdown;
      const previous = lastObservedMarkdownRef.current || "";
      const positiveDiff = Math.max(0, markdown.length - previous.length);
      pendingCharsRef.current += positiveDiff;
      lastObservedMarkdownRef.current = markdown;
      updateStatus('unsynchronized');

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (flushTimeoutRef.current) {
          clearTimeout(flushTimeoutRef.current);
        }
        return;
      }

      const endsWithWordBoundary = /[A-Za-zÀ-ÖØ-öø-ÿ]+\s$/u.test(markdown);
      if (pendingCharsRef.current >= 10 || endsWithWordBoundary) {
        if (flushTimeoutRef.current) {
          clearTimeout(flushTimeoutRef.current);
        }
        flushPendingChanges({ markdown }).catch(() => {});
      } else {
        if (flushTimeoutRef.current) {
          clearTimeout(flushTimeoutRef.current);
        }
        flushTimeoutRef.current = setTimeout(() => {
          flushPendingChanges({ markdown }).catch(() => {});
        }, 500);
      }
    },
    [flushPendingChanges, socket, roomId, updateStatus]
  );

  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  return { isConnected, emitLocalChange, clientId: clientIdRef.current, flushPendingChanges };
}


