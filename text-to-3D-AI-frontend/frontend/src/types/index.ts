// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  status?: number
}

// 3D Model Generation Types (Step 8)
export interface GenerationRequest {
  prompt: string
  negativePrompt?: string
  uploadedImage?: File | string
  sketch?: string
  width?: number
  height?: number
  steps?: number
  guidanceScale?: number
  seed?: number
}

export interface Generated3DModel {
  id: string
  url: string
  prompt: string
  negativePrompt?: string
  uploadedImage?: string
  thumbnail?: string
  format: 'glb' | 'obj' | 'stl'
  fileSize?: number
  createdAt: string
}

export type ExportFormat = 'glb' | 'obj' | 'stl'

export type GenerationStatus = 'idle' | 'uploading' | 'processing' | 'generating' | 'completed' | 'error'

export interface ViewerSettings {
  showGrid: boolean
  showAxes: boolean
  autoRotate: boolean
  wireframe: boolean
  backgroundColor: string
}

// Legacy image type (for compatibility)
export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  steps: number
  guidanceScale: number
  seed?: number
  createdAt: string
}

// UI Types
export type Theme = 'light' | 'dark' | 'system'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

// Store Types
export interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  initTheme: () => void
}

export interface UIState {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export interface GenerationState {
  // Legacy image support
  images: GeneratedImage[]
  isGenerating: boolean
  currentRequest: GenerationRequest | null
  addImage: (image: GeneratedImage) => void
  setGenerating: (generating: boolean) => void
  setCurrentRequest: (request: GenerationRequest | null) => void
  clearImages: () => void
  
  // Step 8: 3D Model Generation
  uploadedImage: File | string | null
  setUploadedImage: (image: File | string | null) => void
  prompt: string
  setPrompt: (prompt: string) => void
  generationStatus: GenerationStatus
  setGenerationStatus: (status: GenerationStatus) => void
  generatedModel: Generated3DModel | null
  setGeneratedModel: (model: Generated3DModel | null) => void
  intermediateData: Record<string, any> | null
  exportFormat: ExportFormat
  setExportFormat: (format: ExportFormat) => void
  viewerSettings: ViewerSettings
  setViewerSettings: (settings: Partial<ViewerSettings>) => void
}

// User Types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}
