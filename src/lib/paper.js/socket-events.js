// lib/socket-events.js

/**
 * Client-to-server events
 * @typedef {Object} ClientToServerEvents
 * @property {function(string): void} 'join-room'
 * @property {function(string): void} 'leave-room'
 * @property {function(DrawingData): void} 'drawing-data'
 * @property {function(TextUpdateData): void} 'text-update'
 * @property {function(Object): void} 'text-formatting-update'
 * @property {function(): void} 'clear-canvas'
 */

/**
 * Server-to-client events
 * @typedef {Object} ServerToClientEvents
 * @property {function(RoomState): void} 'room-state'
 * @property {function(DrawingData): void} 'drawing-data'
 * @property {function(TextUpdateData): void} 'text-update'
 * @property {function(Object): void} 'text-formatting-update'
 * @property {function(): void} 'clear-canvas'
 * @property {function(string): void} 'user-joined'
 * @property {function(string): void} 'user-left'
 */

// Export empty object since this file only contains type definitions
export {};