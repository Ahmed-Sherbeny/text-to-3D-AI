// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// API Endpoints
export const API_ENDPOINTS = {
  health: '/api/health',
  generate: '/api/generate',
  images: '/api/images',
  image: (id: string) => `/api/images/${id}`,
}
