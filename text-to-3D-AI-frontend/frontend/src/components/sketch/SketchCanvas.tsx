/**
 * Sketch Canvas Component
 * Step 9: Main drawing canvas with pointer events support
 */

import { useRef, useEffect, useCallback } from 'react';
import { useSketchStore } from '@/store/sketchStore';
import { setupHighDPICanvas } from '@/utils/canvasUtils';
import type { Point, Stroke } from '@/types/sketch';

interface SketchCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function SketchCanvas({
  width = 512,
  height = 512,
  className = '',
}: SketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    strokes,
    currentStroke,
    tool,
    brushSize,
    brushColor,
    isDrawing,
    setIsDrawing,
    setCurrentStroke,
    addStroke,
  } = useSketchStore();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupHighDPICanvas(canvas, width, height);

    // Fill with white background
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height]);

  // Render a single stroke
  const renderStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // Render strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Render all strokes
    strokes.forEach((stroke) => {
      renderStroke(ctx, stroke);
    });

    // Render current stroke
    if (currentStroke) {
      renderStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke, width, height, renderStroke]);

  // Get point from pointer event
  const getPointFromEvent = useCallback(
    (e: PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure,
      };
    },
    []
  );

  // Start drawing
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Capture pointer
      canvas.setPointerCapture(e.pointerId);

      const point = getPointFromEvent(e);
      const newStroke: Stroke = {
        id: `${Date.now()}-${Math.random()}`,
        points: [point],
        color: brushColor,
        size: brushSize,
        timestamp: Date.now(),
        tool,
      };

      setCurrentStroke(newStroke);
      setIsDrawing(true);
    },
    [tool, brushSize, brushColor, getPointFromEvent, setCurrentStroke, setIsDrawing]
  );

  // Continue drawing
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDrawing || !currentStroke) return;

      e.preventDefault();
      const point = getPointFromEvent(e);

      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, point],
      });
    },
    [isDrawing, currentStroke, getPointFromEvent, setCurrentStroke]
  );

  // Stop drawing
  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Release pointer capture
      canvas.releasePointerCapture(e.pointerId);

      if (currentStroke && currentStroke.points.length > 0) {
        addStroke(currentStroke);
      }

      setCurrentStroke(null);
      setIsDrawing(false);
    },
    [currentStroke, addStroke, setCurrentStroke, setIsDrawing]
  );

  // Cancel drawing
  const handlePointerCancel = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Release pointer capture
      canvas.releasePointerCapture(e.pointerId);

      setCurrentStroke(null);
      setIsDrawing(false);
    },
    [setCurrentStroke, setIsDrawing]
  );

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);

    // Prevent touch scrolling
    canvas.style.touchAction = 'none';

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel]);

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="cursor-crosshair touch-none rounded-lg border-2 border-border bg-white shadow-sm"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
}
