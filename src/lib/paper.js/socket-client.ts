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
    
    // Initialize socket connection with fallback to polling
    const socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl || undefined, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      path: '/api/socket',
      timeout: 20000,
      forceNew: true
    });
    

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    // Narrow type using 'connect_error'
    socketInstance.on('connect_error', (err) => {
      // Connection error handled silently
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
