/**
 * AI Tip Card Component
 * Displays a random AI tip on page load with fade-in animation
 */

import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getRandomTip, getCategoryColor } from '@/data/aiTips';
import type { AITip } from '@/data/aiTips';

export default function AITipCard() {
  // Get random tip only once on mount using lazy initialization
  const [tip] = useState<AITip>(() => getRandomTip());
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in animation after component mounts
  useEffect(() => {
    // Small delay to ensure smooth animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card
      className={`transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">AI Tip</h3>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getCategoryColor(
              tip.category
            )}`}
          >
            {tip.category}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{tip.text}</p>
      </CardContent>
    </Card>
  );
}
