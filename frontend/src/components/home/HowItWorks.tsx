/**
 * How It Works Section
 * Step-by-step process
 */

import { Upload, Wand2, Eye, Download } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload or Sketch',
    description: 'Upload a reference image or draw a simple sketch of your desired 3D object.',
    step: '01',
  },
  {
    icon: Wand2,
    title: 'AI Generation',
    description: 'Our advanced AI analyzes your input and generates a high-quality 3D model.',
    step: '02',
  },
  {
    icon: Eye,
    title: 'Preview & Edit',
    description: 'View your 3D model in our interactive viewer and make adjustments if needed.',
    step: '03',
  },
  {
    icon: Download,
    title: 'Export & Use',
    description: 'Download your model in multiple formats (GLB, OBJ, STL) ready for use.',
    step: '04',
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl space-y-16 px-4">
      {/* Section Header */}
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          How It Works
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          Create professional 3D models in four simple steps
        </p>
      </div>

      {/* Steps */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => (
          <div key={step.title} className="relative">
            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-primary/50 to-transparent lg:block" />
            )}

            {/* Card */}
            <div className="relative space-y-4 rounded-2xl border border-border/50 bg-background/50 p-6 backdrop-blur-sm transition-all hover:shadow-lg">
              {/* Step Number */}
              <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary">
                {step.step}
              </div>

              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <step.icon className="h-7 w-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
