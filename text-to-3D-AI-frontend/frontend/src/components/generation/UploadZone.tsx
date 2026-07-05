import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGenerationStore } from '@/store/generationStore';
import { useUIStore } from '@/store/uiStore';

export default function UploadZone() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadedImage, setUploadedImage } = useGenerationStore();
  const addToast = useUIStore((state) => state.addToast);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      addToast({
        type: 'error',
        message: 'Invalid file type. Please upload JPEG, PNG, or WebP.',
      });
      return false;
    }

    if (file.size > maxSize) {
      addToast({
        type: 'error',
        message: 'File too large. Maximum size is 10MB.',
      });
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setUploadedImage(file);
      addToast({
        type: 'success',
        message: 'Image uploaded successfully!',
      });
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = (): string | null => {
    if (!uploadedImage) return null;
    if (typeof uploadedImage === 'string') return uploadedImage;
    return URL.createObjectURL(uploadedImage);
  };

  const imageUrl = getImageUrl();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Reference Image (Optional)</label>

      {!imageUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex min-h-[200px] cursor-pointer flex-col items-center justify-center
            rounded-lg border-2 border-dashed transition-colors
            ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-accent'
            }
          `}
        >
          <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">
            Drop an image here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WebP (max 10MB)
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border">
          <img
            src={imageUrl}
            alt="Uploaded reference"
            className="h-[200px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="absolute right-2 top-2"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-white">
            <ImageIcon className="h-3 w-3" />
            <span>
              {typeof uploadedImage === 'string'
                ? 'Uploaded'
                : uploadedImage?.name || 'Image'}
            </span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
