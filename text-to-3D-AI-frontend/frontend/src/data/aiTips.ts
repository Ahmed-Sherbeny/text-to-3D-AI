/**
 * AI Tips Data
 * Categories: Prompt, Sketch, Export, Optimization, Rendering
 */

export type TipCategory = 'Prompt' | 'Sketch' | 'Export' | 'Optimization' | 'Rendering';

export interface AITip {
  id: number;
  category: TipCategory;
  text: string;
}

export const aiTips: AITip[] = [
  // Prompt Tips
  {
    id: 1,
    category: 'Prompt',
    text: 'Use detailed prompts to improve model quality and accuracy.',
  },
  {
    id: 2,
    category: 'Prompt',
    text: 'Descriptive adjectives help the AI understand your vision better.',
  },
  {
    id: 3,
    category: 'Prompt',
    text: 'Use nouns before style descriptions for clearer results.',
  },
  {
    id: 4,
    category: 'Prompt',
    text: 'Detailed prompts reduce ambiguity in the generation process.',
  },
  {
    id: 5,
    category: 'Prompt',
    text: 'Experiment with multiple prompts to find the best results.',
  },
  {
    id: 6,
    category: 'Prompt',
    text: 'Specify materials and textures in your prompt for better detail.',
  },

  // Sketch Tips
  {
    id: 7,
    category: 'Sketch',
    text: 'Simple sketches produce faster and more accurate previews.',
  },
  {
    id: 8,
    category: 'Sketch',
    text: 'Clean outlines help the AI understand shapes better.',
  },
  {
    id: 9,
    category: 'Sketch',
    text: 'Keep sketches centered for optimal processing.',
  },
  {
    id: 10,
    category: 'Sketch',
    text: 'High contrast sketches produce cleaner 3D results.',
  },
  {
    id: 11,
    category: 'Sketch',
    text: 'Avoid overlapping objects in your sketches.',
  },
  {
    id: 12,
    category: 'Sketch',
    text: 'Dark backgrounds may affect sketch extraction quality.',
  },
  {
    id: 13,
    category: 'Sketch',
    text: 'Keep object proportions realistic for better results.',
  },

  // Export Tips
  {
    id: 14,
    category: 'Export',
    text: 'Export as GLB for best compatibility across platforms.',
  },
  {
    id: 15,
    category: 'Export',
    text: 'OBJ format is ideal for editing in Blender or Maya.',
  },
  {
    id: 16,
    category: 'Export',
    text: 'STL format is recommended for 3D printing projects.',
  },
  {
    id: 17,
    category: 'Export',
    text: 'Save your generated models frequently to avoid loss.',
  },
  {
    id: 18,
    category: 'Export',
    text: 'Always preview your model before exporting.',
  },

  // Optimization Tips
  {
    id: 19,
    category: 'Optimization',
    text: 'Generate low-poly previews before high-quality models.',
  },
  {
    id: 20,
    category: 'Optimization',
    text: 'Simple geometry generates faster than complex shapes.',
  },
  {
    id: 21,
    category: 'Optimization',
    text: 'AI performs better with isolated objects.',
  },
  {
    id: 22,
    category: 'Optimization',
    text: 'Use high-resolution images whenever possible.',
  },
  {
    id: 23,
    category: 'Optimization',
    text: 'Avoid cluttered reference images for cleaner results.',
  },

  // Rendering Tips
  {
    id: 24,
    category: 'Rendering',
    text: 'Reference images significantly improve generation quality.',
  },
  {
    id: 25,
    category: 'Rendering',
    text: 'Multiple reference images can improve consistency.',
  },
  {
    id: 26,
    category: 'Rendering',
    text: 'Consistent lighting improves reference image quality.',
  },
  {
    id: 27,
    category: 'Rendering',
    text: 'Clear reference photos help the AI capture details.',
  },
  {
    id: 28,
    category: 'Rendering',
    text: 'Avoid blurry or low-quality reference images.',
  },
];

/**
 * Get a random AI tip
 * Should only be called once on component mount
 */
export function getRandomTip(): AITip {
  const randomIndex = Math.floor(Math.random() * aiTips.length);
  return aiTips[randomIndex];
}

/**
 * Get category color for badge
 */
export function getCategoryColor(category: TipCategory): string {
  const colors: Record<TipCategory, string> = {
    Prompt: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    Sketch: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    Export: 'bg-green-500/10 text-green-600 border-green-500/20',
    Optimization: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    Rendering: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  };
  return colors[category];
}
