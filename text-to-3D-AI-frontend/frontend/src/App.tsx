import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from '@/store/themeStore'
import MainLayout from '@/layouts/MainLayout'
import Home from '@/pages/Home'
import Generate from '@/pages/Generate'
import Gallery from '@/pages/Gallery'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

function App() {
  const { theme, initTheme } = useThemeStore()

  useEffect(() => {
    initTheme()
  }, [initTheme])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="generate" element={<Generate />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
