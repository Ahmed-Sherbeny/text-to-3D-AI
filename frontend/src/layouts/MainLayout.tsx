import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import ToastContainer from '@/components/ui/Toast'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

export default function MainLayout() {
  const isMobile = useIsMobile()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main
          className={cn(
            'flex-1 transition-all duration-200',
            !isMobile && 'ml-64'
          )}
        >
          <div className="container py-6 px-4">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
      <ToastContainer />
    </div>
  )
}
