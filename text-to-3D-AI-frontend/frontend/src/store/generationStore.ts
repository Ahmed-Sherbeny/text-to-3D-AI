import { create } from 'zustand';
import type {
  Generated3DModel,
  GenerationStatus,
  ExportFormat,
} from '@/types';

/**
 * Generation Store
 *
 * Manages the state of 3D model generation and gallery
 */
export const useGenerationStore = create<any>((set) => ({
  // 3D Model Generation State

  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  generationStatus: 'idle',
  setGenerationStatus: (status: GenerationStatus) => set({ generationStatus: status }),

  generatedModel: null,
  setGeneratedModel: (model: Generated3DModel | null) => set({ generatedModel: model }),

  intermediateData: null,

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
