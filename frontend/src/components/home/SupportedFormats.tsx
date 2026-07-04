/**
 * Supported Formats Section
 * Display export format options
 */

import { Box, Package, Layers } from 'lucide-react';

const formats = [
  {
    icon: Box,
    name: 'GLB',
    description: 'Best for web and cross-platform compatibility',
    badge: 'Recommended',
    badgeColor: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  {
    icon: Package,
    name: 'OBJ',
    description: 'Perfect for 3D editing software like Blender',
    badge: 'Popular',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  {
    icon: Layers,
    name: 'STL',
    description: 'Ideal for 3D printing and manufacturing',
    badge: '3D Printing',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
];

export default function SupportedFormats() {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-background/80 to-background/50 p-12 backdrop-blur-sm">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Supported Formats
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            Export your 3D models in multiple industry-standard formats
          </p>
        </div>

        {/* Format Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {formats.map((format) => (
            <div
              key={format.name}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/80 p-8 text-center backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 transition-transform group-hover:scale-110">
                <format.icon className="h-10 w-10 text-primary" />
              </div>

              {/* Format Name */}
              <h3 className="mb-2 text-2xl font-bold">{format.name}</h3>

              {/* Badge */}
              <span
                className={`mb-4 inline-block rounded-full border px-3 py-1 text-xs font-medium ${format.badgeColor}`}
              >
                {format.badge}
              </span>

              {/* Description */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {format.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
