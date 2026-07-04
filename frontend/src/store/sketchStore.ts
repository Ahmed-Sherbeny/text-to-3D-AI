/**
 * Sketch Store
 * Step 9: Manages sketch canvas state
 */

import { create } from 'zustand';
import type { Stroke, DrawingTool } from '@/types/sketch';

interface SketchState {
  // Drawing state
  strokes: Stroke[];
  currentStroke: Stroke | null;
  tool: DrawingTool;
  brushSize: number;
  brushColor: string;
  isDrawing: boolean;

  // History
  undoStack: Stroke[][];
  redoStack: Stroke[][];

  // Actions
  setTool: (tool: DrawingTool) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setCurrentStroke: (stroke: Stroke | null) => void;
  addStroke: (stroke: Stroke) => void;
  setStrokes: (strokes: Stroke[]) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useSketchStore = create<SketchState>((set, get) => ({
  // Initial state
  strokes: [],
  currentStroke: null,
  tool: 'brush',
  brushSize: 5,
  brushColor: '#000000',
  isDrawing: false,
  undoStack: [],
  redoStack: [],

  // Actions
  setTool: (tool) => set({ tool }),

  setBrushSize: (size) => set({ brushSize: size }),

  setBrushColor: (color) => set({ brushColor: color }),

  setIsDrawing: (isDrawing) => set({ isDrawing }),

  setCurrentStroke: (stroke) => set({ currentStroke: stroke }),

  addStroke: (stroke) => {
    const { strokes, undoStack } = get();
    set({
      strokes: [...strokes, stroke],
      undoStack: [...undoStack, strokes],
      redoStack: [], // Clear redo stack when new action is performed
    });
  },

  setStrokes: (strokes) => set({ strokes }),

  undo: () => {
    const { strokes, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = [...redoStack, strokes];

    set({
      strokes: previousState,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });
  },

  redo: () => {
    const { strokes, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = [...undoStack, strokes];

    set({
      strokes: nextState,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });
  },

  clear: () => {
    const { strokes, undoStack } = get();
    if (strokes.length === 0) return;

    set({
      strokes: [],
      undoStack: [...undoStack, strokes],
      redoStack: [],
    });
  },

  canUndo: () => get().undoStack.length > 0,

  canRedo: () => get().redoStack.length > 0,
}));
