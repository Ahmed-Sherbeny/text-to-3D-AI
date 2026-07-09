/**
 * Export Controls Component
 * Step 9: Export format and preprocessing options
 */

import { useState } from 'react';
import { Download, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { ExportFormat, PreprocessingOptions } from '@/types/sketch';

interface ExportControlsProps {
  onExport: (format: ExportFormat, preprocessing: PreprocessingOptions) => void;
  disabled?: boolean;
}

export default function ExportControls({ onExport, disabled = false }: ExportControlsProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preprocessing, setPreprocessing] = useState<PreprocessingOptions>({
    targetWidth: 512,
    targetHeight: 512,
    grayscale: true,
    removeBackground: true,
    preserveAspectRatio: true,
  });

  const handleExport = () => {
    onExport(format, preprocessing);
  };

  return (
    <div className="space-y-4">

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={disabled}
        className="w-full gap-2"
        size="lg"
      >
        <Download className="h-5 w-5" />
        Export Sketch
      </Button>
    </div>
  );
}
