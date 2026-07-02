import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeState, Theme } from '@/types'

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme: Theme) => set({ theme }),
      initTheme: () => {
        const stored = localStorage.getItem('theme-storage')
        if (stored) {
          try {
            const { state } = JSON.parse(stored)
            const theme = state.theme as Theme
            if (theme === 'system') {
              const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
              ).matches
              document.documentElement.classList.toggle('dark', prefersDark)
            }
          } catch (e) {
            console.error('Failed to parse theme from storage:', e)
          }
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)
