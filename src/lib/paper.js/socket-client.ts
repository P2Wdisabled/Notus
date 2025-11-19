// lib/socket-client.ts
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { UseSocketReturn } from './types';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

/**
 * Custom hook for socket connection
 * @param roomId - Optional room ID to auto-join
 * @returns UseSocketReturn
 */
type SocketPurpose = 'send' | 'receive';

interface UseSocketOptions {
  purpose?: SocketPurpose;
}

declare global {
  interface Window {
    __notus_socket_server_ready?: boolean;
  }
}

export function useSocket(roomId?: string, options?: UseSocketOptions): UseSocketReturn {
  const purpose: SocketPurpose = options?.purpose || 'receive';
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

    const ensureServerReady = async () => {
      if (window.__notus_socket_server_ready) return true;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }
      try {
        await fetch('/api/socket');
        window.__notus_socket_server_ready = true;
        return true;
      } catch (error) {
        console.error('[Socket] Failed to initialize server route', error);
        return false;
      }
    };

    const connect = async () => {
      const ready = await ensureServerReady();
      if (!ready) {
        if (!cancelled) {
          setTimeout(connect, 2000);
        }
        return;
      }
      if (cancelled) return;

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      socketInstance = io(socketUrl || undefined, {
        transports: ['websocket'],
        upgrade: false,
        autoConnect: true,
        path: '/api/socket',
        timeout: 20000,
        forceNew: true,
        query: {
          purpose,
        },
      });

      socketInstance.on('connect', () => {
        if (!cancelled) {
          setIsConnected(true);
        }
      });

      socketInstance.on('disconnect', () => {
        if (!cancelled) {
          setIsConnected(false);
        }
      });

      socketInstance.on('connect_error', (err) => {
        console.error(`[Socket] Connection error (${purpose})`, err);
      });

      if (!cancelled) {
        setSocket(socketInstance);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [purpose]);

  const joinRoom = useCallback((roomId: string): void => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId: string): void => {
    if (socket) {
      socket.emit('leave-room', roomId);
    }
  }, [socket]);

  // Auto-join room if provided
  useEffect(() => {
    if (socket && roomId) {
      joinRoom(roomId);
    }
  }, [socket, roomId, joinRoom]);

  return { socket, isConnected, joinRoom, leaveRoom };
}
