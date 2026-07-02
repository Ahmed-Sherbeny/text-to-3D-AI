import { create } from 'zustand'
import type { GenerationState, GeneratedImage, GenerationRequest } from '@/types'

/**
 * Generation Store
 * 
 * Manages the state of image generation and gallery
 */
export const useGenerationStore = create<GenerationState>((set) => ({
  images: [],
  isGenerating: false,
  currentRequest: null,
  addImage: (image: GeneratedImage) =>
    set((state) => ({
      images: [image, ...state.images],
    })),
  setGenerating: (generating: boolean) => set({ isGenerating: generating }),
  setCurrentRequest: (request: GenerationRequest | null) =>
    set({ currentRequest: request }),
  clearImages: () => set({ images: [] }),
}))
