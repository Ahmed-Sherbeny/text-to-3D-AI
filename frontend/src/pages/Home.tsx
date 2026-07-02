import { Link } from 'react-router-dom'
import { Sparkles, Image, Zap, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Create stunning images from text descriptions using advanced AI models.',
  },
  {
    icon: Image,
    title: 'High Quality Output',
    description: 'Generate high-resolution images with customizable parameters.',
  },
  {
    icon: Zap,
    title: 'Fast Processing',
    description: 'Get your images in seconds with our optimized generation pipeline.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data and generated images are stored securely and privately.',
  },
]

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Create Amazing Images with{' '}
          <span className="text-primary">AI</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Transform your ideas into stunning visuals using state-of-the-art AI
          image generation technology. Simple, fast, and powerful.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/generate">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Start Generating
            </Button>
          </Link>
          <Link to="/gallery">
            <Button variant="outline" size="lg">
              View Gallery
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Features</h2>
          <p className="text-muted-foreground">
            Everything you need to create amazing images
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-lg bg-primary/5 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to get started?</h2>
        <p className="text-muted-foreground">
          Join thousands of users creating amazing images with AI
        </p>
        <Link to="/generate">
          <Button size="lg">Create Your First Image</Button>
        </Link>
      </section>
    </div>
  )
}
