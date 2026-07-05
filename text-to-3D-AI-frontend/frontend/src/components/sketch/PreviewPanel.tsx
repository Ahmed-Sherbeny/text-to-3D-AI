/**
 * Preview Panel Component
 * Step 9: Show preprocessed image preview
 */

import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

interface PreviewPanelProps {
  previewUrl: string | null;
  isProcessing?: boolean;
  error?: string | null;
}

export default function PreviewPanel({
  previewUrl,
  isProcessing = false,
  error = null,
}: PreviewPanelProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (previewUrl && imgRef.current) {
      const img = imgRef.current;
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
    } else {
      setDimensions(null);
    }
  }, [previewUrl]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Preprocessed Preview</label>
        {dimensions && (
          <span className="text-xs text-muted-foreground">
            {dimensions.width} × {dimensions.height}
          </span>
        )}
      </div>

      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-border bg-muted/30">
        {/* Loading State */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isProcessing && (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!previewUrl && !isProcessing && !error && (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No preview available</p>
            <p className="text-xs text-muted-foreground">Draw something first</p>
          </div>
        )}

        {/* Preview Image */}
        {previewUrl && !isProcessing && !error && (
          <img
            ref={imgRef}
            src={previewUrl}
            alt="Preprocessed sketch preview"
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {/* Info Text */}
      {previewUrl && !error && (
        <p className="text-xs text-muted-foreground">
          This is how your sketch will be processed before generation
        </p>
      )}
    </div>
  );
}
