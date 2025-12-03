// lib/socket-server.ts
import { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { TextUpdateData, SocketAckResponse, TitleUpdateData, DrawingData, CursorPositionData } from './types';
import { PrismaDocumentService } from '../services/PrismaDocumentService';
import { recordDocumentHistory } from '../documentHistory';

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

async function persistTextUpdate(data: TextUpdateData): Promise<boolean> {
  // Si pas de snapshot, on ne peut pas persister - mais ce n'est pas une erreur si c'est juste une mise à jour de diffusion
  if (!data.persistSnapshot) {
    return true; // Pas d'erreur, juste pas de persistance nécessaire
  }
  
  if (
    !process.env.DATABASE_URL ||
    !data.documentId ||
    typeof data.userId !== 'number' ||
    !data.userEmail
  ) {
    return true; // Pas d'erreur si les conditions ne sont pas remplies (pas de DB configurée)
  }

  try {
    const service = await getDocumentServiceInstance();
    const documentId = Number(data.documentId);

    // Récupérer le snapshot précédent pour calculer le diff
    let previousContent: string | null = null;
    try {
      const existing = await service.getDocumentById(documentId);
      if (existing.success && existing.document) {
        previousContent = existing.document.content;
      }
    } catch {
      // Si on ne trouve pas le document, on considère que c'est une première version
      previousContent = null;
    }

    const nextContent = JSON.stringify(data.persistSnapshot);

    // Enregistrer l'historique avant de persister le nouveau contenu
    await recordDocumentHistory({
      documentId,
      userId: data.userId,
      userEmail: data.userEmail,
      previousContent,
      nextContent,
    });

    await service.createOrUpdateDocumentById(
      documentId,
      data.userId,
      data.userEmail,
      data.title || '',
      nextContent,
      Array.isArray(data.tags) ? data.tags : []
    );
    
    return true; // Persistance réussie
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
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_SOCKET_CORS_ORIGIN || '*',
        credentials: true,
      },
    });

  io.on('connection', (socket) => {
    // Stocker le clientId associé à ce socket pour chaque room
    const clientIdByRoom = new Map<string, string>();

    socket.on('join-room', (roomId: string, clientId?: string) => {
      socket.join(roomId);
      if (clientId) {
        clientIdByRoom.set(roomId, clientId);
      }
      socket.to(roomId).emit('user-joined', clientId || socket.id);
    });

    socket.on('leave-room', (roomId: string, clientId?: string) => {
      socket.leave(roomId);
      // Utiliser le clientId si fourni, sinon utiliser celui stocké, sinon socket.id
      const idToEmit = clientId || clientIdByRoom.get(roomId) || socket.id;
      socket.to(roomId).emit('user-left', idToEmit);
      clientIdByRoom.delete(roomId);
    });

    // Quand le socket se déconnecte, notifier toutes les rooms qu'il a quittées
    socket.on('disconnect', () => {
      for (const [roomId, clientId] of clientIdByRoom.entries()) {
        socket.to(roomId).emit('user-left', clientId);
      }
      clientIdByRoom.clear();
    });

    socket.on('text-update', async (roomId: string, data: TextUpdateData, ack?: (response: SocketAckResponse) => void) => {
      try {
        // 1. Diffuser immédiatement aux autres clients
        socket.to(roomId).emit('text-update', data);
        
        // 2. Lancer la persistance en arrière-plan (ne bloque pas la diffusion)
        persistTextUpdate(data).catch((error) => {
          console.error("❌ Erreur lors de la persistance (non-bloquante):", error);
        });
        
        // 3. Répondre immédiatement avec succès
        ack?.({ ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        ack?.({ ok: false, error: message });
      }
    });

    socket.on('text-update-with-cursor', async (roomId: string, data: TextUpdateData, ack?: (response: SocketAckResponse) => void) => {
      try {
        // 1. Diffuser immédiatement aux autres clients
        socket.to(roomId).emit('text-update', data);
        if (data.cursor) {
          socket.to(roomId).emit('cursor-position', data.cursor);
        }
        
        // 2. Lancer la persistance en arrière-plan (ne bloque pas la diffusion)
        persistTextUpdate(data).catch((error) => {
          console.error("❌ Erreur lors de la persistance (non-bloquante):", error);
        });
        
        // 3. Répondre immédiatement avec succès
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
