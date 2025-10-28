"use client";
import { useEffect, useMemo, useRef } from "react";
import { useSocket } from "./socket-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

interface UseCollaborativeTitleOptions {
  roomId: string | undefined;
  onRemoteTitle: (title: string) => void;
}

function generateClientId(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useCollaborativeTitle({ roomId, onRemoteTitle }: UseCollaborativeTitleOptions) {
  const clientIdRef = useRef<string>(generateClientId());
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket(roomId);

  useEffect(() => {
    if (!socket || !roomId) return;

      const handleTitleUpdate: ServerToClientEvents['title-update'] = (data) => {
        // Ignore own updates using clientId
        if ((data as any).clientId && (data as any).clientId === clientIdRef.current) {
          return;
        }
        if (typeof data.title === 'string') {
          onRemoteTitle(data.title);
        }
      };

    socket.on('title-update', handleTitleUpdate);

    return () => {
      socket.off('title-update', handleTitleUpdate);
    };
  }, [socket, roomId, onRemoteTitle]);

  useEffect(() => {
    if (!socket || !roomId) return;
    joinRoom(roomId);
    return () => leaveRoom(roomId);
  }, [socket, roomId, joinRoom, leaveRoom]);

  const emitTitleChange = useMemo(() => {
    return (title: string) => {
      if (!socket || !roomId) return;
      socket.emit('title-update', roomId, { title, clientId: clientIdRef.current, ts: Date.now() });
    };
  }, [socket, roomId]);

  return { isConnected, emitTitleChange, clientId: clientIdRef.current };
}
