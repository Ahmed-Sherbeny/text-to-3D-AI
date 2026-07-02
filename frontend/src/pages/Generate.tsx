import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import InputPanel from '@/components/generation/InputPanel';
import ExportPanel from '@/components/generation/ExportPanel';
import Viewer3D from '@/components/3d/Viewer3D';
import ViewerToolbar from '@/components/3d/ViewerToolbar';
import { useGenerationStore } from '@/store/generationStore';

export default function Generate() {
  const { generatedModel } = useGenerationStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Generate 3D Model</h1>
        <p className="text-muted-foreground">
          Create stunning 3D models from text descriptions and reference images
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Input Panel */}
        <div className="space-y-6">
          <InputPanel />
        </div>

        {/* Right Column: 3D Viewer */}
        <div className="space-y-6">
          {/* 3D Viewer Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
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
