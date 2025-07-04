import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'Home' },
    { name: 'Receiving', href: '/receiving', icon: 'Truck' },
    { name: 'Inventory', href: '/inventory', icon: 'Package' },
    { name: 'Administration', href: '/administration', icon: 'Syringe' },
    { name: 'Reconciliation', href: '/reconciliation', icon: 'Calculator' },
    { name: 'Loss Report', href: '/loss-report', icon: 'AlertTriangle' },
    { name: 'Reports', href: '/reports', icon: 'FileText' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ]
  
  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 px-4 bg-primary">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <ApperIcon name="Shield" size={20} className="text-primary" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">VaxTrack</h1>
              <p className="text-sm opacity-90">Pro</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <ApperIcon name={item.icon} size={18} className="mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <ApperIcon name="User" size={16} />
            <span>Healthcare Admin</span>
          </div>
        </div>
      </div>
    </div>
  )
  
  // Mobile Sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={onToggle}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-4 bg-primary">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <ApperIcon name="Shield" size={20} className="text-primary" />
                  </div>
                  <div className="text-white">
                    <h1 className="text-xl font-bold">VaxTrack</h1>
                    <p className="text-sm opacity-90">Pro</p>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <ApperIcon name="X" size={24} />
                </button>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onToggle}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <ApperIcon name={item.icon} size={18} className="mr-3" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ApperIcon name="User" size={16} />
                  <span>Healthcare Admin</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
  
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}

export default Sidebar