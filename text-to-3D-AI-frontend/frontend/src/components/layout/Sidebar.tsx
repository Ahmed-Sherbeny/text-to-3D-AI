import { NavLink } from 'react-router-dom'
import { Home, Sparkles, Image, Settings, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/store/uiStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import Button from '@/components/ui/Button'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/generate', icon: Sparkles, label: 'Generate' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore()
  const isMobile = useIsMobile()

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-200',
          isMobile && !isSidebarOpen && '-translate-x-full',
          !isMobile && 'translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          {isMobile && (
            <div className="flex items-center justify-between border-b px-4 py-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
