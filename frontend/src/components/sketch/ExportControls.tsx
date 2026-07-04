/**
 * Export Controls Component
 * Step 9: Export format and preprocessing options
 */

import { useState } from 'react';
import { Download, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { ExportFormat, PreprocessingOptions } from '@/types/sketch';

interface ExportControlsProps {
  onExport: (format: ExportFormat, preprocessing: PreprocessingOptions) => void;
  disabled?: boolean;
}

export default function ExportControls({ onExport, disabled = false }: ExportControlsProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preprocessing, setPreprocessing] = useState<PreprocessingOptions>({
    targetWidth: 512,
    targetHeight: 512,
    grayscale: true,
    removeBackground: true,
    preserveAspectRatio: true,
  });

  const handleExport = () => {
    onExport(format, preprocessing);
  };

  return (
    <div className="space-y-4">
      {/* Export Format */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Export Format</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['png', 'jpeg', 'base64', 'blob'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                format === fmt
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Preprocessing Options
        </span>
        <span className="text-xs text-muted-foreground">
          {showAdvanced ? 'Hide' : 'Show'}
        </span>
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Target Resolution</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  value={preprocessing.targetWidth}
                  onChange={(e) =>
                    setPreprocessing({
                      ...preprocessing,
                      targetWidth: Number(e.target.value),
                    })
                  }
                  min="64"
                  max="2048"
                  step="64"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Width"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={preprocessing.targetHeight}
                  onChange={(e) =>
                    setPreprocessing({
                      ...preprocessing,
                      targetHeight: Number(e.target.value),
                    })
                  }
                  min="64"
                  max="2048"
                  step="64"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Height"
                />
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preprocessing.grayscale}
                onChange={(e) =>
                  setPreprocessing({
                    ...preprocessing,
                    grayscale: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Convert to Grayscale</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preprocessing.removeBackground}
                onChange={(e) =>
                  setPreprocessing({
                    ...preprocessing,
                    removeBackground: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Remove Background</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preprocessing.preserveAspectRatio}
                onChange={(e) =>
                  setPreprocessing({
                    ...preprocessing,
                    preserveAspectRatio: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-foreground">Preserve Aspect Ratio</span>
            </label>
          </div>
        </div>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={disabled}
        className="w-full gap-2"
        size="lg"
      >
        <Download className="h-5 w-5" />
        Export Sketch
      </Button>
    </div>
  );
}
