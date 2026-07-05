import axios, { AxiosError, AxiosResponse } from 'axios'
import { API_CONFIG } from '@/config/api.config'
import type { ApiResponse } from '@/types'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message)
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Generic API call wrapper
export async function apiCall<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown,
  config?: object
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient[method]<T>(url, data, config)
    return {
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error: error.message,
        status: error.response?.status,
      }
    }
    return {
      error: 'An unexpected error occurred',
    }
  }
}

// Specific API methods
export const api = {
  get: <T>(url: string, config?: object) => apiCall<T>('get', url, undefined, config),
  post: <T>(url: string, data?: unknown, config?: object) => apiCall<T>('post', url, data, config),
  put: <T>(url: string, data?: unknown, config?: object) => apiCall<T>('put', url, data, config),
  delete: <T>(url: string, config?: object) => apiCall<T>('delete', url, undefined, config),
}

export default api
