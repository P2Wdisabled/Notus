// lib/socket-server.ts
import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { TextUpdateData, SocketAckResponse, TitleUpdateData, DrawingData, CursorPositionData } from './types';
import { PrismaDocumentService } from '../services/PrismaDocumentService';

let io: IOServer | null = null;
let documentServicePromise: Promise<PrismaDocumentService> | null = null;

async function getDocumentServiceInstance() {
  if (!documentServicePromise) {
    documentServicePromise = (async () => {
      const service = new PrismaDocumentService();
      if (process.env.DATABASE_URL) {
        try {
          await service.initializeTables();
        } catch (error) {
          console.error("❌ Impossible d'initialiser les tables Prisma (websocket):", error);
        }
      }
      return service;
    })();
  }
  return documentServicePromise;
}

async function persistTextUpdate(data: TextUpdateData) {
  if (
    !process.env.DATABASE_URL ||
    !data.documentId ||
    typeof data.userId !== 'number' ||
    !data.userEmail ||
    !data.persistSnapshot
  ) {
    return;
  }

  try {
    const service = await getDocumentServiceInstance();
    await service.createOrUpdateDocumentById(
      Number(data.documentId),
      data.userId,
      data.userEmail,
      data.title || '',
      JSON.stringify(data.persistSnapshot),
      Array.isArray(data.tags) ? data.tags : []
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement websocket du document:", error);
    throw error;
  }
}

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

    io = new IOServer(httpServer, {
      path: '/socket.io',
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

    socket.on('text-update', async (roomId: string, data: TextUpdateData, ack?: (response: SocketAckResponse) => void) => {
      try {
        socket.to(roomId).emit('text-update', data);
        await persistTextUpdate(data);
        ack?.({ ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        ack?.({ ok: false, error: message });
      }
    });

    socket.on('text-update-with-cursor', async (roomId: string, data: TextUpdateData, ack?: (response: SocketAckResponse) => void) => {
      try {
        socket.to(roomId).emit('text-update', data);
        if (data.cursor) {
          socket.to(roomId).emit('cursor-position', data.cursor);
        }
        await persistTextUpdate(data);
        ack?.({ ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        ack?.({ ok: false, error: message });
      }
    });

    socket.on('title-update', (roomId: string, data: TitleUpdateData & { clientId: string; ts: number }) => {
      socket.to(roomId).emit('title-update', data);
    });

    socket.on('drawing-data', (roomId: string, data: DrawingData) => {
      socket.to(roomId).emit('drawing-data', data);
    });

    socket.on('cursor-position', (roomId: string, data: CursorPositionData) => {
      socket.to(roomId).emit('cursor-position', data);
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}
