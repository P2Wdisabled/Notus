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
type SocketPurpose = 'shared';

interface UseSocketOptions {
  purpose?: SocketPurpose;
}

declare global {
  interface Window {
    __notus_socket_server_ready?: boolean;
  }
}

type SharedSocketState = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  refCount: number;
  initPromise: Promise<Socket<ServerToClientEvents, ClientToServerEvents>> | null;
};

const sharedSocketState: SharedSocketState = {
  socket: null,
  refCount: 0,
  initPromise: null,
};

async function ensureServerReady(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.__notus_socket_server_ready) return true;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    await fetch('/api/socket', {
      cache: 'no-store',
      headers: {
        'cache-control': 'no-store',
      },
    });
    window.__notus_socket_server_ready = true;
    return true;
  } catch (error) {
    console.error('[Socket] Failed to initialize server route', error);
    return false;
  }
}

async function getSharedSocketInstance(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  if (sharedSocketState.socket) {
    return sharedSocketState.socket;
  }
  if (sharedSocketState.initPromise) {
    return sharedSocketState.initPromise;
  }

  sharedSocketState.initPromise = (async () => {
    const ready = await ensureServerReady();
    if (!ready) {
      throw new Error('Socket server not ready');
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const instance = io(socketUrl || undefined, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      autoConnect: true,
      path: '/api/socket',
      timeout: 20000,
      forceNew: false,
      query: {
        purpose: 'shared',
      },
    });

    sharedSocketState.socket = instance;
    return instance;
  })();

  try {
    const result = await sharedSocketState.initPromise;
    sharedSocketState.initPromise = null;
    return result;
  } catch (error) {
    sharedSocketState.initPromise = null;
    throw error;
  }
}

function releaseSharedSocketInstance() {
  sharedSocketState.refCount = Math.max(0, sharedSocketState.refCount - 1);
  if (sharedSocketState.refCount === 0 && sharedSocketState.socket) {
    sharedSocketState.socket.disconnect();
    sharedSocketState.socket = null;
  }
}

export function useSocket(roomId?: string, _options?: UseSocketOptions): UseSocketReturn {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

    const connect = async () => {
      try {
        const instance = await getSharedSocketInstance();
        if (cancelled) return;
        socketInstance = instance;
        sharedSocketState.refCount += 1;
        setSocket(instance);
        setIsConnected(instance.connected);

        const handleConnect = () => !cancelled && setIsConnected(true);
        const handleDisconnect = () => !cancelled && setIsConnected(false);
        const handleConnectError = (err: unknown) => {
          console.error('[Socket] Connection error (shared)', err);
        };

        instance.on('connect', handleConnect);
        instance.on('disconnect', handleDisconnect);
        instance.on('connect_error', handleConnectError);

        return () => {
          instance.off('connect', handleConnect);
          instance.off('disconnect', handleDisconnect);
          instance.off('connect_error', handleConnectError);
        };
      } catch (error) {
        console.error('[Socket] Failed to connect', error);
      }
    };

    const cleanupPromise = connect();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => {
        cleanup?.();
        if (socketInstance) {
          releaseSharedSocketInstance();
        }
      });
    };
  }, []);

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
