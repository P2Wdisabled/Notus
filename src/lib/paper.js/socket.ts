// lib/socket.ts
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { UseSocketReturn, ClientToServerEvents, ServerToClientEvents } from './types';

/**
 * Custom hook for socket connection
 * @param roomId - Optional room ID to auto-join
 * @returns UseSocketReturn
 */
export function useSocket(roomId?: string): UseSocketReturn {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketInstance.on('error', (error: Error) => {
      console.error('Socket error:', error);
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
