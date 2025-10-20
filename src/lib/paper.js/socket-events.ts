// lib/socket-events.ts
// This file contains socket event type definitions

import { DrawingData, TextUpdateData, RoomState } from './types';

// Client-to-server events
export interface ClientToServerEvents {
  'join-room': (roomId: string) => void;
  'leave-room': (roomId: string) => void;
  'drawing-data': (data: DrawingData) => void;
  'text-update': (data: TextUpdateData) => void;
  'text-formatting-update': (data: any) => void;
  'clear-canvas': () => void;
}

// Server-to-client events
export interface ServerToClientEvents {
  'room-state': (state: RoomState) => void;
  'drawing-data': (data: DrawingData) => void;
  'text-update': (data: TextUpdateData) => void;
  'text-formatting-update': (data: any) => void;
  'clear-canvas': () => void;
  'user-joined': (userId: string) => void;
  'user-left': (userId: string) => void;
}
