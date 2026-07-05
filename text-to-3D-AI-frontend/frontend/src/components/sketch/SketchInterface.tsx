/**
 * Sketch Interface Component
 * Step 9: Complete sketch drawing interface
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import SketchCanvas from './SketchCanvas';
import Toolbar from './Toolbar';
import BrushSelector from './BrushSelector';
import ExportControls from './ExportControls';
import PreviewPanel from './PreviewPanel';
import { useSketchStore } from '@/store/sketchStore';
import { exportCanvas, isCanvasEmpty } from '@/utils/canvasUtils';
import { useUIStore } from '@/store/uiStore';
import type { ExportFormat, PreprocessingOptions } from '@/types/sketch';

interface SketchInterfaceProps {
  onExport?: (dataUrl: string, blob: Blob) => void;
  className?: string;
}

export default function SketchInterface({ onExport, className = '' }: SketchInterfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { undo, redo, clear } = useSketchStore();
  const addToast = useUIStore((state) => state.addToast);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      }

      // Clear: Delete key
      if (e.key === 'Delete') {
        e.preventDefault();
        if (window.confirm('Are you sure you want to clear the canvas?')) {
          clear();
        }
      }

      // Tool shortcuts
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        useSketchStore.getState().setTool('brush');
      }

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        useSketchStore.getState().setTool('eraser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, clear]);

  // Get canvas element
  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    if (canvasRef.current) return canvasRef.current;

    // Find canvas in DOM
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvasRef.current = canvas;
      return canvas;
    }

    return null;
  }, []);

  // Handle export
  const handleExport = useCallback(
    async (format: ExportFormat, preprocessing: PreprocessingOptions) => {
      const canvas = getCanvas();
      if (!canvas) {
        addToast({
          type: 'error',
          message: 'Canvas not found',
        });
        return;
      }

      // Check if canvas is empty
      if (isCanvasEmpty(canvas)) {
        addToast({
          type: 'error',
          message: 'Cannot export empty canvas. Please draw something first.',
        });
        return;
      }

      setIsExporting(true);
      setExportError(null);

      try {
        const result = await exportCanvas(canvas, {
          format,
          quality: format === 'jpeg' ? 0.95 : undefined,
          preprocessing,
        });

        setPreviewUrl(result.dataUrl);

        addToast({
          type: 'success',
          message: `Sketch exported as ${format.toUpperCase()}`,
        });

        // Callback with export data
        if (onExport) {
          onExport(result.dataUrl, result.blob);
        }

        // Download file for non-base64/blob formats
        if (format === 'png' || format === 'jpeg') {
          const link = document.createElement('a');
          link.download = `sketch-${Date.now()}.${format}`;
          link.href = result.dataUrl;
          link.click();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Export failed';
        setExportError(errorMessage);
        addToast({
          type: 'error',
          message: `Export failed: ${errorMessage}`,
        });
        console.error('Export error:', error);
      } finally {
        setIsExporting(false);
      }
    },
    [getCanvas, addToast, onExport]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
        <Toolbar />
        <div className="hidden text-xs text-muted-foreground lg:block">
          Shortcuts: B (Brush) • E (Eraser) • Ctrl+Z (Undo) • Ctrl+Y (Redo)
        </div>
      </div>

      {/* Canvas - centered */}
      <div className="flex justify-center rounded-lg border bg-background p-6">
        <SketchCanvas width={512} height={512} />
      </div>

      {/* Brush Controls */}
      <div className="space-y-4 rounded-lg border bg-background p-6">
        <h4 className="text-sm font-semibold">Brush Settings</h4>
        <BrushSelector />
      </div>

      {/* Export Section */}
      <div className="space-y-4 rounded-lg border bg-background p-6">
        <h4 className="text-sm font-semibold">Export Options</h4>
        <ExportControls onExport={handleExport} disabled={isExporting} />
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="rounded-lg border bg-background p-6">
          <h4 className="mb-4 text-sm font-semibold">Processed Preview</h4>
          <PreviewPanel
            previewUrl={previewUrl}
            isProcessing={isExporting}
            error={exportError}
          />
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="mb-3 text-sm font-semibold text-foreground">How to use</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Draw with your mouse, touchscreen, or stylus/pen</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Switch between Brush and Eraser tools</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Adjust brush size and color as needed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Use Undo/Redo to fix mistakes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Export your sketch with preprocessing options</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
