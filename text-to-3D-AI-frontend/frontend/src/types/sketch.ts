/**
 * Sketch Canvas Type Definitions
 * Step 9: Sketch Canvas
 */

export interface Point {
  x: number;
  y: number;
  pressure?: number; // For stylus/pen input
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  timestamp: number;
  tool: DrawingTool;
}

export type DrawingTool = 'brush' | 'eraser';

export type ExportFormat = 'png' | 'jpeg' | 'base64' | 'blob';

export interface CanvasState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  tool: DrawingTool;
  brushSize: number;
  brushColor: string;
  isDrawing: boolean;
  undoStack: Stroke[][];
  redoStack: Stroke[][];
}

export interface PreprocessingOptions {
  targetWidth: number;
  targetHeight: number;
  grayscale: boolean;
  removeBackground: boolean;
  preserveAspectRatio: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // 0-1 for JPEG
  preprocessing?: PreprocessingOptions;
}

export interface CanvasExportResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  format: string;
}
