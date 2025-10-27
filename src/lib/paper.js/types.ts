// lib/types.ts
// This file contains type definitions for the collaborative notepad
import { Socket } from 'socket.io-client';

export type Mode = 'draw' | 'text';

export interface DrawingData {
  type: 'start' | 'draw' | 'end';
  point?: paper.Point;
  color?: string;
  size?: number;
}

export interface TextUpdateData {
  content: string;
  clientId?: string;
  ts?: number;
}

export interface TitleUpdateData {
  title: string;
  clientId?: string;
  ts?: number;
}

export interface RoomState {
  drawing: DrawingData[];
  text: string;
  textFormatting?: TextFormatting;
}

export interface ToolbarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  textFormatting: TextFormatting;
  setTextFormatting: (formatting: Partial<TextFormatting>) => void;
  isConnected: boolean;
  onClearAllData?: () => void;
  calMode?: boolean;
}

export interface DrawingCanvasProps {
  brushColor: string;
  brushSize: number;
  onDrawingData: (data: DrawingData) => void;
  socket: Socket | null;
}

export interface TextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  textFormatting: TextFormatting;
  socket: Socket | null;
}

export interface CollaborativeNotepadProps {
  roomId?: string;
}

export interface SerializedSegment {
  point: [number, number];
  handleIn?: [number, number];
  handleOut?: [number, number];
}

export interface SerializedPath {
  segments: SerializedSegment[];
  color: string;
  size: number;
  type: 'pen' | 'eraser';
  closed?: boolean;
}

export interface LegacySerializedPath {
  points: number[][];
  color: string;
  size: number;
  type: 'pen' | 'eraser';
}

export type SerializedPathData = SerializedPath | LegacySerializedPath;

export interface TextFormatting {
  color: string;
  backgroundColor?: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface LocalStorageData {
  drawings: SerializedPathData[];
  text: string;
  textFormatting?: TextFormatting;
  timestamp: number;
}

export interface Settings {
  mode: Mode;
  brushColor: string;
  brushSize: number;
  lastUpdated: number;
}

export interface ExportOptions {
  content: string;
  filename?: string;
  format: 'pdf' | 'docx' | 'txt';
}

// Socket types
export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

// Client-to-server events
export interface ClientToServerEvents {
  'join-room': (roomId: string) => void;
  'leave-room': (roomId: string) => void;
  'drawing-data': (data: DrawingData) => void;
  'text-update': (data: TextUpdateData) => void;
  'title-update': (roomId: string, data: TitleUpdateData & { clientId: string; ts: number }) => void;
  'text-formatting-update': (data: any) => void;
  'clear-canvas': () => void;
}

// Server-to-client events
export interface ServerToClientEvents {
  'room-state': (state: RoomState) => void;
  'drawing-data': (data: DrawingData) => void;
  'text-update': (data: TextUpdateData) => void;
  'title-update': (data: TitleUpdateData & { clientId: string; ts: number }) => void;
  'text-formatting-update': (data: any) => void;
  'clear-canvas': () => void;
  'user-joined': (userId: string) => void;
  'user-left': (userId: string) => void;
}
