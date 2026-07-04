/**
 * Sketch Toolbar Component
 * Step 9: Tool selection and canvas actions
 */

import { Brush, Eraser, Undo, Redo, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSketchStore } from '@/store/sketchStore';

export default function Toolbar() {
  const {
    tool,
    setTool,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    strokes,
  } = useSketchStore();

  const handleClear = () => {
    if (strokes.length === 0) return;

    if (window.confirm('Are you sure you want to clear the canvas?')) {
      clear();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tool Selection */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
        <Button
          variant={tool === 'brush' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTool('brush')}
          title="Brush (B)"
          className="gap-2"
        >
          <Brush className="h-4 w-4" />
          <span className="hidden sm:inline">Brush</span>
        </Button>
        <Button
          variant={tool === 'eraser' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTool('eraser')}
          title="Eraser (E)"
          className="gap-2"
        >
          <Eraser className="h-4 w-4" />
          <span className="hidden sm:inline">Eraser</span>
        </Button>
      </div>

      {/* History Actions */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Clear Action */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClear}
        disabled={strokes.length === 0}
        title="Clear Canvas (Delete)"
        className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">Clear</span>
      </Button>
    </div>
  );
}
