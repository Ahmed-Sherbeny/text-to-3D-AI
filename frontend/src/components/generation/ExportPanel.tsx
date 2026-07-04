import { FileBox, Clock, HardDrive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import ExportButtons from './ExportButtons';
import { useGenerationStore } from '@/store/generationStore';

export default function ExportPanel() {
  const { generatedModel, generationStatus } = useGenerationStore();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export & Download</CardTitle>
        <CardDescription>
          {generatedModel
            ? 'Your model is ready to download'
            : 'Generated model will appear here'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!generatedModel ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/10 p-8 text-center">
            <FileBox className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="mb-1.5 font-medium text-muted-foreground">
              No model generated yet
            </p>
            <p className="text-sm text-muted-foreground/80">
              {generationStatus === 'generating'
                ? 'Your model is being generated...'
                : 'Fill in the prompt and click Generate'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Model Preview */}
            <div className="overflow-hidden rounded-lg border">
              <img
                src={generatedModel.thumbnail}
                alt="Model preview"
                className="h-[200px] w-full object-cover"
              />
            </div>

            {/* Model Information */}
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Prompt
                </p>
                <p className="text-sm leading-relaxed">{generatedModel.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">File Size</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatFileSize(generatedModel.fileSize || 0)}
                  </p>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Created</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatDate(generatedModel.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <ExportButtons />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
