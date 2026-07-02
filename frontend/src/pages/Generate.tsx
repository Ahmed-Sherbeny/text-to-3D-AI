import { useState, FormEvent } from 'react'
import { Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useUIStore } from '@/store/uiStore'
import { useGenerationStore } from '@/store/generationStore'
import Loader from '@/components/ui/Loader'

export default function Generate() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  
  const addToast = useUIStore((state) => state.addToast)
  const { addImage } = useGenerationStore()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) {
      addToast({
        type: 'error',
        message: 'Please enter a prompt',
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImage(null)

    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock generated image
      const mockImage = {
        id: Date.now().toString(),
        url: `https://picsum.photos/seed/${Date.now()}/512/512`,
        prompt,
        negativePrompt: negativePrompt || undefined,
        width: 512,
        height: 512,
        steps: 50,
        guidanceScale: 7.5,
        createdAt: new Date().toISOString(),
      }

      setGeneratedImage(mockImage.url)
      addImage(mockImage)

      addToast({
        type: 'success',
        message: 'Image generated successfully!',
      })
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to generate image. Please try again.',
      })
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Generate Image</h1>
        <p className="text-muted-foreground">
          Describe the image you want to create and let AI do the magic
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Image Settings</CardTitle>
            <CardDescription>Configure your image generation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Prompt *
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A serene landscape with mountains and a lake at sunset..."
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="negativePrompt" className="text-sm font-medium">
                  Negative Prompt
                </label>
                <Input
                  id="negativePrompt"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="blurry, low quality, distorted..."
                  disabled={isGenerating}
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                isLoading={isGenerating}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Your generated image will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted">
              {isGenerating ? (
                <div className="text-center space-y-4">
                  <Loader size="lg" />
                  <p className="text-sm text-muted-foreground">
                    Generating your image...
                  </p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generated image will appear here
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
