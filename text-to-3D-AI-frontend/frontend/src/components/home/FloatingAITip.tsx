/**
 * Floating AI Tip Widget
 * Displays on Hero section with random tip
 */

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRandomTip, getCategoryColor } from '@/data/aiTips';
import type { AITip } from '@/data/aiTips';

export default function FloatingAITip() {
  const [tip] = useState<AITip>(() => getRandomTip());
  const [isVisible, setIsVisible] = useState(false);
  const [currentPage] = useState(0);
  const totalPages = 3;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`absolute left-4 top-1/2 hidden -translate-y-1/2 lg:block ${
        isVisible ? 'animate-in slide-in-from-left duration-500' : 'opacity-0'
      }`}
    >
      <div className="w-72 rounded-2xl border border-border/50 bg-background/80 p-6 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">AI Tip</h3>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(
              tip.category
            )}`}
          >
            {tip.category}
          </span>
        </div>

        {/* Tip Content */}
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{tip.text}</p>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentPage ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              className="rounded-lg p-1 hover:bg-accent"
              disabled
              aria-label="Previous tip"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              className="rounded-lg p-1 hover:bg-accent"
              disabled
              aria-label="Next tip"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
