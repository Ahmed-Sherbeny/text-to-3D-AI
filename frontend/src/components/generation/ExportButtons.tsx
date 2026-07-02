import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useGenerationStore } from '@/store/generationStore';
import { useUIStore } from '@/store/uiStore';
import type { ExportFormat } from '@/types';

export default function ExportButtons() {
  const { generatedModel, exportFormat, setExportFormat } = useGenerationStore();
  const addToast = useUIStore((state) => state.addToast);
  const [copied, setCopied] = useState(false);

  const formats: { value: ExportFormat; label: string; description: string }[] = [
    { value: 'glb', label: 'GLB', description: 'Binary glTF (Recommended)' },
    { value: 'obj', label: 'OBJ', description: 'Wavefront Object' },
    { value: 'stl', label: 'STL', description: '3D Printing' },
  ];

  const handleDownload = (format: ExportFormat) => {
    if (!generatedModel) return;

    // TODO: Implement actual download from backend
    addToast({
      type: 'info',
      message: `Downloading ${format.toUpperCase()} file...`,
    });

    // Simulate download
    console.log(`Downloading model in ${format} format:`, generatedModel.url);
  };

  const handleCopyLink = async () => {
    if (!generatedModel) return;

    try {
      // TODO: Generate actual shareable link from backend
      const shareableLink = `${window.location.origin}/model/${generatedModel.id}`;
      await navigator.clipboard.writeText(shareableLink);

      setCopied(true);
      addToast({
        type: 'success',
        message: 'Link copied to clipboard!',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to copy link',
      });
    }
  };

  if (!generatedModel) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Format Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Export Format</label>
        <div className="grid grid-cols-3 gap-2">
          {formats.map((format) => (
            <button
              key={format.value}
              onClick={() => setExportFormat(format.value)}
              className={`
                rounded-lg border p-3 text-center transition-colors
                ${
                  exportFormat === format.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }
              `}
            >
              <p className="font-medium">{format.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {format.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={() => handleDownload(exportFormat)}
        className="w-full gap-2"
        size="lg"
      >
        <Download className="h-4 w-4" />
        Download {exportFormat.toUpperCase()}
      </Button>

      {/* Copy Link Button */}
      <Button
        onClick={handleCopyLink}
        variant="outline"
        className="w-full gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Link Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Download Link
          </>
        )}
      </Button>
    </div>
  );
}
