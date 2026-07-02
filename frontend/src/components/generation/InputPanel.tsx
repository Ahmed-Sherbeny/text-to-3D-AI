import { FormEvent } from 'react';
import { Sparkles, Pencil } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import UploadZone from './UploadZone';
import PromptEditor from './PromptEditor';
import { useGenerationStore } from '@/store/generationStore';
import { useUIStore } from '@/store/uiStore';

export default function InputPanel() {
  const {
    prompt,
    uploadedImage,
    generationStatus,
    setGenerationStatus,
    setGeneratedModel,
  } = useGenerationStore();

  const addToast = useUIStore((state) => state.addToast);

  const isGenerating = generationStatus === 'generating' || generationStatus === 'processing';

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

    try {
      setGenerationStatus('generating');

      // TODO: Replace with actual API call to backend
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
          {/* Upload Zone */}
          <UploadZone />

          {/* Prompt Editor */}
          <PromptEditor disabled={isGenerating} />

          {/* Optional: Sketch Placeholder */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Sketch (Coming Soon)
            </label>
            <div className="flex min-h-[100px] items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/10">
              <div className="text-center">
                <Pencil className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  Sketch input will be available soon
                </p>
              </div>
            </div>
          </div>

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
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-sm font-medium text-primary">
                {generationStatus === 'generating'
                  ? 'Creating your 3D model...'
                  : 'Processing...'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
