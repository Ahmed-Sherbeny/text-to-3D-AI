import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import InputPanel from '@/components/generation/InputPanel';
import ExportPanel from '@/components/generation/ExportPanel';
import Viewer3D from '@/components/3d/Viewer3D';
import ViewerToolbar from '@/components/3d/ViewerToolbar';
import SceneProgress from '@/components/generation/SceneProgress';
import { useGenerationStore } from '@/store/generationStore';

export default function Generate() {
  const { generatedModel } = useGenerationStore();

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Generate 3D Model</h1>
        <p className="text-muted-foreground">
          Create stunning 3D models from text descriptions and reference images
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Input Panel */}
        <div className="flex flex-col">
          <InputPanel />
          <SceneProgress />
        </div>

        {/* Right Column: 3D Viewer & Export */}
        <div className="flex flex-col gap-8">
          {/* 3D Viewer Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle>3D Viewer</CardTitle>
                  <CardDescription>
                    {generatedModel
                      ? 'Interact with your generated model'
                      : 'Preview will appear here'}
                  </CardDescription>
                </div>
                <ViewerToolbar />
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                <Viewer3D />
              </div>
            </CardContent>
          </Card>

          {/* Export Panel */}
          <ExportPanel />
        </div>
      </div>
    </div>
  );
}
