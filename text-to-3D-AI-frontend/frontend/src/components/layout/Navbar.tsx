import { Link } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore'
import { useUIStore } from '@/store/uiStore'
import Button from '@/components/ui/Button'
import { useIsMobile } from '@/hooks/useMediaQuery'

export default function Navbar() {
  const { theme, setTheme } = useThemeStore()
  const { toggleSidebar } = useUIStore()
  const isMobile = useIsMobile()

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="OptiForge3D" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">OptiForge3D</span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="transition-all hover:bg-accent"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  )
}
