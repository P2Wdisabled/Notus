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
    // Silent fail
    return false;
  }
}

async function getSharedSocketInstance(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  // NEVER create socket if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Cannot create socket: offline');
  }

  if (sharedSocketState.socket) {
    // If socket exists but we're offline, disconnect it
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      sharedSocketState.socket.disconnect();
      sharedSocketState.socket = null;
      throw new Error('Cannot use socket: offline');
    }
    return sharedSocketState.socket;
  }
  if (sharedSocketState.initPromise) {
    return sharedSocketState.initPromise;
  }

  sharedSocketState.initPromise = (async () => {
    // Double check we're still online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Cannot create socket: offline');
    }

    const ready = await ensureServerReady();
    if (!ready) {
      throw new Error('Socket server not ready');
    }

    // Triple check we're still online before creating socket
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Cannot create socket: offline');
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const instance = io(socketUrl || undefined, {
      transports: ['websocket'],
      upgrade: false,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
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
    let cleanup: (() => void) | undefined;

    const handleOffline = () => {
      if (socketInstance) {
        // Disable reconnection completely
        if (socketInstance.io && socketInstance.io.opts) {
          socketInstance.io.opts.reconnection = false;
          socketInstance.io.opts.autoConnect = false;
        }
        if (socketInstance.connected) {
          socketInstance.disconnect();
        }
        setIsConnected(false);
      }
      // Also disconnect the shared socket instance
      if (sharedSocketState.socket) {
        if (sharedSocketState.socket.io && sharedSocketState.socket.io.opts) {
          sharedSocketState.socket.io.opts.reconnection = false;
          sharedSocketState.socket.io.opts.autoConnect = false;
        }
        if (sharedSocketState.socket.connected) {
          sharedSocketState.socket.disconnect();
        }
      }
    };

    const handleOnline = async () => {
      if (cancelled) return;
      
      // Reset server ready flag to force reconnection
      if (typeof window !== 'undefined') {
        window.__notus_socket_server_ready = false;
      }
      
      // Reconnect using the shared socket instance
      try {
        const instance = sharedSocketState.socket || await getSharedSocketInstance();
        if (cancelled) return;
        
        // Re-enable reconnection when coming back online
        if (instance.io && instance.io.opts) {
          instance.io.opts.reconnection = true;
          instance.io.opts.autoConnect = true;
        }
        
        if (!instance.connected) {
          instance.connect();
        }
        
        // Update local state if needed
        if (socketInstance !== instance) {
          socketInstance = instance;
          sharedSocketState.refCount += 1;
          setSocket(instance);
          setIsConnected(instance.connected);
        } else {
          setIsConnected(instance.connected);
        }
      } catch (error) {
        // Silent fail
      }
    };

    const connect = async () => {
      try {
        // Don't connect if offline - completely skip socket creation
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setSocket(null);
          setIsConnected(false);
          return;
        }

        const instance = await getSharedSocketInstance();
        if (cancelled) return;
        
        // Double check we're still online after getting instance
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (instance.connected) {
            instance.disconnect();
          }
          setSocket(null);
          setIsConnected(false);
          return;
        }

        socketInstance = instance;
        sharedSocketState.refCount += 1;
        setSocket(instance);
        setIsConnected(instance.connected);

        const handleConnect = () => {
          // Only set connected if we're still online
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            if (instance.connected) {
              instance.disconnect();
            }
            setIsConnected(false);
            return;
          }
          if (!cancelled) setIsConnected(true);
        };
        const handleDisconnect = () => !cancelled && setIsConnected(false);
        const handleConnectError = (err: unknown) => {
          setIsConnected(false);
          // Disable reconnection on error
          if (instance.io && instance.io.opts) {
            instance.io.opts.reconnection = false;
            instance.io.opts.autoConnect = false;
          }
        };

        instance.on('connect', handleConnect);
        instance.on('disconnect', handleDisconnect);
        instance.on('connect_error', handleConnectError);

        cleanup = () => {
          instance.off('connect', handleConnect);
          instance.off('disconnect', handleDisconnect);
          instance.off('connect_error', handleConnectError);
        };
      } catch (error) {
        // Silent fail - set socket to null if offline
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setSocket(null);
          setIsConnected(false);
        }
      }
    };

    // Listen to online/offline events
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const cleanupPromise = connect();

    return () => {
      cancelled = true;
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      cleanupPromise.then(() => {
        cleanup?.();
        if (socketInstance) {
          releaseSharedSocketInstance();
        }
      });
    };
  }, []);

  const joinRoom = useCallback((roomId: string, clientId?: string): void => {
    if (socket) {
      socket.emit('join-room', roomId, clientId);
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId: string, clientId?: string): void => {
    if (socket) {
      socket.emit('leave-room', roomId, clientId);
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
