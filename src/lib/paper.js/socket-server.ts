// lib/socket-server.ts
import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: IOServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  console.log('🔌 Initializing Socket.IO server...');
  
  io = new IOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGIN || '*',
      credentials: true,
    },
  });
  
  console.log('🔌 Socket.IO server created with config:', {
    path: '/api/socket',
    corsOrigin: process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGIN || '*'
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('join-room', (roomId: string) => {
      console.log('🔌 Client joining room:', { socketId: socket.id, roomId });
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('leave-room', (roomId: string) => {
      console.log('🔌 Client leaving room:', { socketId: socket.id, roomId });
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
    });

    socket.on('text-update', (roomId: string, data: any) => {
      console.log('🔌 Text update received:', { socketId: socket.id, roomId, dataLength: data?.content?.length });
      socket.to(roomId).emit('text-update', data);
    });

    socket.on('title-update', (roomId: string, data: any) => {
      console.log('🔌 Title update received:', { socketId: socket.id, roomId, title: data?.title });
      socket.to(roomId).emit('title-update', data);
    });

    socket.on('drawing-data', (roomId: string, data: any) => {
      console.log('🔌 Drawing data received:', { socketId: socket.id, roomId });
      socket.to(roomId).emit('drawing-data', data);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}
