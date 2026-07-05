import { useGenerationStore } from '@/store/generationStore';

interface PromptEditorProps {
  disabled?: boolean;
}

export default function PromptEditor({ disabled = false }: PromptEditorProps) {
  const { prompt, setPrompt } = useGenerationStore();

  return (
    <div className="space-y-2">
      <label htmlFor="prompt" className="text-sm font-medium">
        Prompt <span className="text-destructive">*</span>
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the 3D model you want to create... e.g., A detailed fantasy sword with ornate engravings and a glowing blue gem in the hilt"
        disabled={disabled}
        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={5}
      />
      <p className="text-xs text-muted-foreground">
        {prompt.length}/500 characters
      </p>
    </div>
  );
}
