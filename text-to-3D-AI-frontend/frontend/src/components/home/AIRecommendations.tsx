/**
 * AI Recommendations Section
 * 4 recommendation cards with tips
 */

import { Lightbulb, Image, Pencil, Package } from 'lucide-react';

const recommendations = [
  {
    icon: Lightbulb,
    title: 'Prompt Tip',
    description: 'Use descriptive prompts with materials, colors and style.',
    badge: 'Prompt',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    iconColor: 'from-blue-500/20 to-blue-600/20',
  },
  {
    icon: Image,
    title: 'Image Tip',
    description: 'Upload isolated objects on clean backgrounds.',
    badge: 'Rendering',
    badgeColor: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    iconColor: 'from-pink-500/20 to-pink-600/20',
  },
  {
    icon: Pencil,
    title: 'Sketch Tip',
    description: 'Simple clean sketches improve generation quality.',
    badge: 'Sketch',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    iconColor: 'from-purple-500/20 to-purple-600/20',
  },
  {
    icon: Package,
    title: 'Export Tip',
    description: 'Use GLB for the best compatibility across platforms.',
    badge: 'Export',
    badgeColor: 'bg-green-500/10 text-green-600 border-green-500/20',
    iconColor: 'from-green-500/20 to-green-600/20',
  },
];

export default function AIRecommendations() {
  return (
    <section className="relative mx-auto max-w-7xl px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl" />

      <div className="space-y-12">
        {/* Section Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 text-sm backdrop-blur">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="font-medium">AI-Powered Recommendations</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            ✨ AI Recommendations
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Smart tips to help you get the best results from our AI generation engine
          </p>
        </div>

        {/* Recommendation Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recommendations.map((rec) => (
            <div
              key={rec.title}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/80 p-6 backdrop-blur-sm transition-all hover:-translate-y-2 hover:shadow-xl"
            >
              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Icon */}
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${rec.iconColor} transition-transform group-hover:scale-110`}
              >
                <rec.icon className="h-7 w-7 text-primary" />
              </div>

              {/* Badge */}
              <span
                className={`mb-3 inline-block rounded-full border px-3 py-1 text-xs font-medium ${rec.badgeColor}`}
              >
                {rec.badge}
              </span>

              {/* Content */}
              <h3 className="mb-2 text-lg font-semibold">{rec.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {rec.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
