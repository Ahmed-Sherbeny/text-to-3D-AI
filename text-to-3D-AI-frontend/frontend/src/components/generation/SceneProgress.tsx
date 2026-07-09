import React from 'react';
import { useGenerationStore } from '@/store/generationStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function SceneProgress() {
  const { generationStatus, intermediateData } = useGenerationStore();

  if (generationStatus !== 'generating' && generationStatus !== 'processing' && generationStatus !== 'completed') {
    return null;
  }

  if (!intermediateData) {
    return null;
  }

  const stage = intermediateData.stage;
  const objects = intermediateData.objects || [];
  
  return (
    <Card className="mt-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {stage === 'decomposing' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {stage === 'generating_objects' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {stage === 'layout' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {stage === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          Scene Generation Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className={stage === 'decomposing' ? 'font-bold text-primary' : 'text-muted-foreground'}>
              1. Analyzing Scene Description
            </span>
            {stage !== 'decomposing' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
          
          <div className="flex justify-between items-center">
            <span className={stage === 'generating_objects' ? 'font-bold text-primary' : 'text-muted-foreground'}>
              2. Generating Individual Objects
            </span>
            {(stage === 'layout' || stage === 'completed') && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
          
          <div className="flex justify-between items-center">
            <span className={stage === 'layout' ? 'font-bold text-primary' : 'text-muted-foreground'}>
              3. Computing Spatial Layout
            </span>
            {stage === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
        </div>

        {objects.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Detected Objects:</h4>
            <div className="flex flex-wrap gap-2">
              {objects.map((obj: string, i: number) => (
                <div key={i} className="px-3 py-1 bg-background border rounded-full text-xs flex items-center gap-2">
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
