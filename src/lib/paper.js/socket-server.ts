// lib/socket-server.ts
import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: IOServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

    io = new IOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGIN || '*',
        credentials: true,
      },
    });

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
    });

    socket.on('text-update', (roomId: string, data: any) => {
      socket.to(roomId).emit('text-update', data);
    });

    socket.on('title-update', (roomId: string, data: any) => {
      socket.to(roomId).emit('title-update', data);
    });

    socket.on('drawing-data', (roomId: string, data: any) => {
      socket.to(roomId).emit('drawing-data', data);
    });

    socket.on('cursor-position', (roomId: string, data: any) => {
      socket.to(roomId).emit('cursor-position', data);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}
