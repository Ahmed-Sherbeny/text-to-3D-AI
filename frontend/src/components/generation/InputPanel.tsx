import { FormEvent, useState } from 'react';
import { Sparkles, Image as ImageIcon, Pencil } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import UploadZone from './UploadZone';
import PromptEditor from './PromptEditor';
import SketchInterface from '@/components/sketch/SketchInterface';
import AITipCard from '@/components/ui/AITipCard';
import { useGenerationStore } from '@/store/generationStore';
import { useUIStore } from '@/store/uiStore';

type InputMode = 'upload' | 'sketch';

export default function InputPanel() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [sketchData, setSketchData] = useState<{ dataUrl: string; blob: Blob } | null>(null);

  const {
    prompt,
    uploadedImage,
    generationStatus,
    setGenerationStatus,
    setGeneratedModel,
  } = useGenerationStore();

  const addToast = useUIStore((state) => state.addToast);

  const isGenerating = generationStatus === 'generating' || generationStatus === 'processing';

  // Handle sketch export
  const handleSketchExport = (dataUrl: string, blob: Blob) => {
    setSketchData({ dataUrl, blob });
    addToast({
      type: 'success',
      message: 'Sketch ready for generation',
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      addToast({
        type: 'error',
        message: 'Please enter a prompt to generate a model',
      });
      return;
    }

    if (prompt.length < 10) {
      addToast({
        type: 'error',
        message: 'Prompt is too short. Please provide more details.',
      });
      return;
    }

    // Check for input (image or sketch)
    if (!uploadedImage && !sketchData) {
      addToast({
        type: 'warning',
        message: 'Consider uploading an image or drawing a sketch for better results',
      });
    }

    try {
      setGenerationStatus('generating');

      // TODO: Replace with actual API call to backend
      // Will send: prompt, uploadedImage (if exists), sketchData (if exists)
      // Simulate generation process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock generated model
      const mockModel = {
        id: Date.now().toString(),
        url: '/placeholder-model.glb', // Placeholder until backend is ready
        prompt,
        uploadedImage: uploadedImage ? 'uploaded' : undefined,
        thumbnail: `https://picsum.photos/seed/${Date.now()}/400/400`,
        format: 'glb' as const,
        fileSize: 2500000, // 2.5MB
        createdAt: new Date().toISOString(),
      };

      setGeneratedModel(mockModel);
      setGenerationStatus('completed');

      addToast({
        type: 'success',
        message: '3D model generated successfully!',
      });
    } catch (error) {
      setGenerationStatus('error');
      addToast({
        type: 'error',
        message: 'Failed to generate model. Please try again.',
      });
      console.error('Generation error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Generation</CardTitle>
        <CardDescription>
          Upload a reference image and describe your 3D model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Mode Selector */}
          <div className="flex gap-1.5 rounded-lg border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'upload'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Image</span>
              <span className="sm:hidden">Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('sketch')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'sketch'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Draw Sketch</span>
              <span className="sm:hidden">Sketch</span>
            </button>
          </div>

          {/* Upload Zone or Sketch Interface */}
          {inputMode === 'upload' ? (
            <UploadZone />
          ) : (
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <SketchInterface onExport={handleSketchExport} />
            </div>
          )}

          {/* Prompt Editor */}
          <PromptEditor disabled={isGenerating} />

          {/* Generate Button */}
          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            isLoading={isGenerating}
            disabled={isGenerating || !prompt.trim()}
          >
            <Sparkles className="h-5 w-5" />
            {isGenerating ? 'Generating Model...' : 'Generate 3D Model'}
          </Button>

          {/* Status Message */}
          {isGenerating && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm font-semibold text-primary">
                {generationStatus === 'generating'
                  ? 'Creating your 3D model...'
                  : 'Processing...'}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          )}

          {/* AI Tip Widget */}
          <AITipCard />
        </form>
      </CardContent>
    </Card>
  );
}
