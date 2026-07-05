import { create } from 'zustand';
import type {
  GenerationState,
  GeneratedImage,
  GenerationRequest,
  Generated3DModel,
  GenerationStatus,
  ExportFormat,
} from '@/types';

/**
 * Generation Store
 *
 * Manages the state of 3D model generation and gallery
 */
export const useGenerationStore = create<GenerationState>((set) => ({
  // Legacy image support (from Step 5)
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

  // Step 8: 3D Model Generation State
  uploadedImage: null,
  setUploadedImage: (image) => set({ uploadedImage: image }),

  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  generationStatus: 'idle',
  setGenerationStatus: (status: GenerationStatus) => set({ generationStatus: status }),

  generatedModel: null,
  setGeneratedModel: (model: Generated3DModel | null) => set({ generatedModel: model }),

  exportFormat: 'glb',
  setExportFormat: (format: ExportFormat) => set({ exportFormat: format }),

  viewerSettings: {
    showGrid: true,
    showAxes: true,
    autoRotate: false,
    wireframe: false,
    backgroundColor: '#1a1a1a',
  },
  setViewerSettings: (settings) =>
    set((state) => ({
      viewerSettings: { ...state.viewerSettings, ...settings },
    })),
}));
