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
export function useSocket(roomId?: string): UseSocketReturn {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Use same-origin connection (no explicit URL = current domain)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    console.log('🔌 Socket connection config:', {
      socketUrl,
      hasEnvVar: !!process.env.NEXT_PUBLIC_SOCKET_URL,
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server',
      willConnectTo: socketUrl || 'same-origin'
    });
    
    // Initialize socket connection with fallback to polling
    const socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl || undefined, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      path: '/api/socket',
      timeout: 20000,
      forceNew: true
    });
    
    console.log('🔌 Socket instance created:', {
      connected: socketInstance.connected,
      id: socketInstance.id,
      url: 'connecting...'
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to server:', {
        id: socketInstance.id,
        transport: socketInstance.io?.engine?.transport?.name
      });
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ Disconnected from server:', reason);
    });

    // Narrow type using 'connect_error'
    socketInstance.on('connect_error', (err) => {
      console.error('🚨 Socket connect_error:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
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
