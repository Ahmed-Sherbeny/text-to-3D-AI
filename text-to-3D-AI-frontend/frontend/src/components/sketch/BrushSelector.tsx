/**
 * Brush Selector Component
 * Step 9: Brush size and color controls
 */

import { useSketchStore } from '@/store/sketchStore';

export default function BrushSelector() {
  const { brushSize, brushColor, tool, setBrushSize, setBrushColor } = useSketchStore();

  return (
    <div className="space-y-4">
      {/* Brush Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="brush-size" className="text-sm font-medium text-foreground">
            {tool === 'brush' ? 'Brush' : 'Eraser'} Size
          </label>
          <span className="text-sm font-medium text-muted-foreground">{brushSize}px</span>
        </div>
        <input
          id="brush-size"
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1px</span>
          <span>50px</span>
        </div>
      </div>

      {/* Brush Color (only for brush tool) */}
      {tool === 'brush' && (
        <div className="space-y-2">
          <label htmlFor="brush-color" className="text-sm font-medium text-foreground">
            Brush Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brush-color"
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="h-10 w-20 cursor-pointer rounded-lg border-2 border-border"
            />
            <input
              type="text"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="#000000"
            />
          </div>

          {/* Color Presets */}
          <div className="flex flex-wrap gap-2">
            {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(
              (color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                    brushColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Select color ${color}`}
                />
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
}
