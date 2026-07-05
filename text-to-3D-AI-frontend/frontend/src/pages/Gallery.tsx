import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useGenerationStore } from '@/store/generationStore';

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const { images } = useGenerationStore();

  const filteredImages = images.filter((image) =>
    image.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
        <p className="text-muted-foreground">
          Browse and manage your generated 3D models
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search models..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No models yet</p>
              <p className="text-sm text-muted-foreground">
                Generate your first 3D model to see it here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((image) => (
            <Card key={image.id} className="group overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <CardContent className="p-4">
                <p className="line-clamp-2 text-sm">{image.prompt}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
