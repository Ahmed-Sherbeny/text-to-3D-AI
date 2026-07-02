// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  status?: number
}

// Image Generation Types
export interface GenerationRequest {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  steps?: number
  guidanceScale?: number
  seed?: number
}

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
  images: GeneratedImage[]
  isGenerating: boolean
  currentRequest: GenerationRequest | null
  addImage: (image: GeneratedImage) => void
  setGenerating: (generating: boolean) => void
  setCurrentRequest: (request: GenerationRequest | null) => void
  clearImages: () => void
}

// User Types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}
