// lib/socket.js
import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * @typedef {Object} UseSocketReturn
 * @property {Socket | null} socket
 * @property {boolean} isConnected
 * @property {function(string): void} joinRoom
 * @property {function(string): void} leaveRoom
 */

/**
 * Custom hook for socket connection
 * @param {string} [roomId] - Optional room ID to auto-join
 * @returns {UseSocketReturn}
 */
export function useSocket(roomId) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

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

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId) => {
    if (socket) {
      socket.emit('join-room', roomId);
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId) => {
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