// lib/types.js
// This file contains type definitions converted from TypeScript to JSDoc for documentation

/**
 * @typedef {'draw' | 'text'} Mode
 */

/**
 * @typedef {Object} DrawingData
 * @property {'start' | 'draw' | 'end'} type
 * @property {paper.Point} [point]
 * @property {string} [color]
 * @property {number} [size]
 */

/**
 * @typedef {Object} TextUpdateData
 * @property {string} content
 */

/**
 * @typedef {Object} RoomState
 * @property {DrawingData[]} drawing
 * @property {string} text
 * @property {TextFormatting} [textFormatting]
 */

/**
 * @typedef {Object} ToolbarProps
 * @property {Mode} mode
 * @property {function(Mode): void} setMode
 * @property {string} brushColor
 * @property {function(string): void} setBrushColor
 * @property {number} brushSize
 * @property {function(number): void} setBrushSize
 * @property {TextFormatting} textFormatting
 * @property {function(Partial<TextFormatting>): void} setTextFormatting
 * @property {boolean} isConnected
 * @property {function(): void} [onClearAllData]
 */

/**
 * @typedef {Object} DrawingCanvasProps
 * @property {string} brushColor
 * @property {number} brushSize
 * @property {function(DrawingData): void} onDrawingData
 * @property {Socket | null} socket
 */

/**
 * @typedef {Object} TextEditorProps
 * @property {string} content
 * @property {function(string): void} onContentChange
 * @property {TextFormatting} textFormatting
 * @property {Socket | null} socket
 */

/**
 * @typedef {Object} CollaborativeNotepadProps
 * @property {string} [roomId]
 */

/**
 * @typedef {Object} SerializedSegment
 * @property {[number, number]} point
 * @property {[number, number]} [handleIn]
 * @property {[number, number]} [handleOut]
 */

/**
 * @typedef {Object} SerializedPath
 * @property {SerializedSegment[]} segments
 * @property {string} color
 * @property {number} size
 * @property {'pen' | 'eraser'} type
 * @property {boolean} [closed]
 */

/**
 * @typedef {Object} LegacySerializedPath
 * @property {number[][]} points
 * @property {string} color
 * @property {number} size
 * @property {'pen' | 'eraser'} type
 */

/**
 * @typedef {SerializedPath | LegacySerializedPath} SerializedPathData
 */

/**
 * @typedef {Object} TextFormatting
 * @property {string} color
 * @property {string} [backgroundColor]
 * @property {number} fontSize
 * @property {string} fontFamily
 * @property {string} fontWeight
 * @property {'left' | 'center' | 'right'} textAlign
 */

/**
 * @typedef {Object} LocalStorageData
 * @property {SerializedPathData[]} drawings
 * @property {string} text
 * @property {TextFormatting} [textFormatting]
 * @property {number} timestamp
 */

// Export empty object since this file only contains type definitions
export {};