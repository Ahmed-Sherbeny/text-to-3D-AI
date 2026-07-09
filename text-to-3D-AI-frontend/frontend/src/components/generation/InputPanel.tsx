import { FormEvent, useState } from 'react';
import { Sparkles, Box, ImageIcon, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import PromptEditor from './PromptEditor';
import UploadZone from './UploadZone';
import SketchInterface from '@/components/sketch/SketchInterface';

import { useGenerationStore } from '@/store/generationStore';
import { useUIStore } from '@/store/uiStore';

type InputMode = 'text' | 'scene';
type ExtraMode = 'none' | 'upload' | 'sketch';

export default function InputPanel() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [extraMode, setExtraMode] = useState<ExtraMode>('none');
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

    try {
      setGenerationStatus('generating');
      
      const payload: any = {
        input_type: inputMode,
        prompt: prompt,
        parameters: {}
      };
      
      // Pass along image/sketch data if present (for future integration)
      if (extraMode === 'upload' && uploadedImage) {
        payload.parameters.image = uploadedImage;
        payload.input_type = 'image';
      } else if (extraMode === 'sketch' && sketchData) {
        payload.parameters.sketch = sketchData.dataUrl;
        payload.input_type = 'sketch';
      }
      
      const response = await fetch('http://localhost:8000/generations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Backend API error');
      }
      
      const job = await response.json();
      const generationId = job.generation_id;
      const taskId = job.celery_task_id;
      
      let status = 'pending';
      let finalUrl = '';
      
      while (status === 'pending' || status === 'processing') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusRes = await fetch(`http://localhost:8000/generations/${taskId}/status`);
        const statusData = await statusRes.json();
        
        status = statusData.status;
        
        if (status === 'completed') {
          finalUrl = `http://localhost:8000/static/${statusData.output_file_url}`;
        } else if (status === 'failed' || status === 'error') {
          throw new Error(statusData.error_message || 'Generation failed on backend');
        }
      }

      const mockModel = {
        id: generationId,
        url: finalUrl,
        prompt,
        thumbnail: `https://picsum.photos/seed/${generationId}/400/400`,
        format: 'glb' as const,
        fileSize: 2500000,
        createdAt: new Date().toISOString(),
      };

      setGeneratedModel(mockModel);
      setGenerationStatus('completed');

      addToast({
        type: 'success',
        message: inputMode === 'scene' ? '3D Scene generated successfully!' : '3D model generated successfully!',
      });
    } catch (error: any) {
      setGenerationStatus('error');
      addToast({
        type: 'error',
        message: error.message || 'Failed to generate model. Please try again.',
      });
      console.error('Generation error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Generation</CardTitle>
        <CardDescription>
          Describe the 3D model or scene you want to generate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-1.5 rounded-lg border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">Single Object</span>
              <span className="sm:hidden">Object</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('scene')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                inputMode === 'scene'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Full Scene</span>
              <span className="sm:hidden">Scene</span>
            </button>
          </div>

          {inputMode === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtraMode(extraMode === 'upload' ? 'none' : 'upload')}
                  className={extraMode === 'upload' ? 'bg-primary/10 border-primary/20' : ''}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {extraMode === 'upload' ? 'Hide Upload' : 'Add Reference Image'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtraMode(extraMode === 'sketch' ? 'none' : 'sketch')}
                  className={extraMode === 'sketch' ? 'bg-primary/10 border-primary/20' : ''}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {extraMode === 'sketch' ? 'Hide Sketch' : 'Draw Sketch'}
                </Button>
              </div>

              {extraMode === 'upload' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <UploadZone />
                </div>
              )}

              {extraMode === 'sketch' && (
                <div className="rounded-lg border border-border bg-muted/10 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <SketchInterface onExport={handleSketchExport} />
                </div>
              )}
            </div>
          )}

          <PromptEditor disabled={isGenerating} />

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            isLoading={isGenerating}
            disabled={isGenerating || !prompt.trim()}
          >
            <Sparkles className="h-5 w-5" />
            {isGenerating ? 'Generating Model...' : `Generate 3D ${inputMode === 'scene' ? 'Scene' : 'Model'}`}
          </Button>

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


        </form>
      </CardContent>
    </Card>
  );
}
