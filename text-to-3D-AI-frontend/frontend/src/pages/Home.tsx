import { Link } from 'react-router-dom';
import { Sparkles, Box, Zap, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import AIRecommendations from '@/components/home/AIRecommendations';
import HowItWorks from '@/components/home/HowItWorks';
import SupportedFormats from '@/components/home/SupportedFormats';

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
    <div className="space-y-32 pb-24">
      {/* Hero Section - FULL WIDTH */}
      <section className="relative overflow-hidden">
        {/* Full-width background glow - extends to viewport edges */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-primary/5 to-transparent blur-3xl" />
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-secondary/5 to-transparent blur-3xl" />
        </div>

        {/* Content container - constrained width */}
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl space-y-12 px-4 py-24 text-center md:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-4 py-2 text-sm backdrop-blur-xl shadow-lg">
                <Box className="h-4 w-4 text-primary" />
                <span className="font-medium">AI-Powered 3D Generation</span>
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Create Amazing{' '}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                  3D Models
                </span>{' '}
                with AI
              </h1>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg lg:text-xl">
                Transform your ideas into stunning 3D models using state-of-the-art AI generation
                technology. Simple, fast, and powerful.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/generate">
                <Button size="lg" className="gap-2 text-base shadow-xl transition-all hover:shadow-2xl">
                  <Sparkles className="h-5 w-5" />
                  Start Generating
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Stats - with glassmorphism */}
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 pt-12 md:grid-cols-4 md:gap-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="space-y-2 rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all hover:shadow-lg"
                >
                  <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendations Section - NEW */}
      <AIRecommendations />

      {/* Features Section */}
      <section className="mx-auto max-w-7xl space-y-16 px-4">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Everything You Need
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Powerful features designed to help you create professional 3D models with ease
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group flex h-full flex-col border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:-translate-y-2 hover:shadow-xl"
            >
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 transition-all group-hover:scale-110 group-hover:from-primary/20 group-hover:to-secondary/20">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section - NEW */}
      <HowItWorks />

      {/* Supported Formats Section - NEW */}
      <SupportedFormats />

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-border/50">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10" />
          <div className="space-y-8 px-8 py-24 text-center backdrop-blur-sm md:px-16 md:py-32">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Join thousands of creators and developers using OptiForge3D to bring their 3D visions
              to life
            </p>
            <Link to="/generate">
              <Button size="lg" className="gap-2 text-base shadow-xl transition-all hover:shadow-2xl">
                <Sparkles className="h-5 w-5" />
                Create Your First Model
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
