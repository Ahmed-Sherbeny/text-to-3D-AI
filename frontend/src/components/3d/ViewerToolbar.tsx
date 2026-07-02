import { Grid3x3, Move, RotateCw, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGenerationStore } from '@/store/generationStore';

export default function ViewerToolbar() {
  const { viewerSettings, setViewerSettings } = useGenerationStore();

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        variant={viewerSettings.showGrid ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewerSettings({ showGrid: !viewerSettings.showGrid })}
        title="Toggle Grid"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>

      <Button
        variant={viewerSettings.showAxes ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewerSettings({ showAxes: !viewerSettings.showAxes })}
        title="Toggle Axes"
      >
        <Move className="h-4 w-4" />
      </Button>

      <Button
        variant={viewerSettings.autoRotate ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewerSettings({ autoRotate: !viewerSettings.autoRotate })}
        title="Toggle Auto-Rotate"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      <Button
        variant={viewerSettings.wireframe ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewerSettings({ wireframe: !viewerSettings.wireframe })}
        title="Toggle Wireframe"
      >
        {viewerSettings.wireframe ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
