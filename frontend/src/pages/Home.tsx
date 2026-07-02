import { Link } from 'react-router-dom';
import { Sparkles, Box, Zap, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Create stunning 3D models from text descriptions using advanced AI technology.',
  },
  {
    icon: Box,
    title: 'High Quality Models',
    description: 'Generate production-ready 3D models with customizable parameters and formats.',
  },
  {
    icon: Zap,
    title: 'Fast Processing',
    description: 'Get your 3D models in minutes with our optimized generation pipeline.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data and generated models are stored securely with enterprise-grade encryption.',
  },
];

const stats = [
  { value: '10K+', label: 'Models Generated' },
  { value: '5K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 5min', label: 'Avg. Generation Time' },
];

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="space-y-8 py-16 text-center md:py-24">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur">
              <Box className="h-4 w-4 text-primary" />
              <span className="font-medium">AI-Powered 3D Generation</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Create Amazing{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                3D Models
              </span>{' '}
              with AI
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              Transform your ideas into stunning 3D models using state-of-the-art AI generation
              technology. Simple, fast, and powerful.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/generate">
              <Button size="lg" className="gap-2 text-base">
                <Sparkles className="h-5 w-5" />
                Start Generating
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/gallery">
              <Button variant="outline" size="lg" className="text-base">
                View Gallery
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything You Need
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to help you create professional 3D models with ease
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary to-secondary opacity-10" />
        <div className="space-y-6 p-12 text-center md:p-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Join thousands of creators and developers using OptiForge3D to bring their 3D visions
            to life
          </p>
          <Link to="/generate">
            <Button size="lg" className="gap-2 text-base">
              <Sparkles className="h-5 w-5" />
              Create Your First Model
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
