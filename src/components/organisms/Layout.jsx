import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '@/components/organisms/Sidebar'
import Header from '@/components/organisms/Header'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  const getPageTitle = () => {
    const path = location.pathname
    const titles = {
      '/': 'Dashboard',
      '/receiving': 'Vaccine Receiving',
      '/inventory': 'Inventory Management',
      '/administration': 'Dose Administration',
      '/reconciliation': 'Monthly Reconciliation',
      '/loss-report': 'Loss Reporting',
      '/reports': 'Reports & Analytics',
      '/settings': 'System Settings',
    }
    return titles[path] || 'VaxTrack Pro'
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64">
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle()}
        />
        
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout