import React, { useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { BookOpen, Download, User, Settings, Home } from 'lucide-react'
import MyCourses from './MyCourses'
import AccountSettings from './AccountSettings'
import DashboardHome from './DashboardHome'

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const sidebarItems = [
    {
      path: '/dashboard',
      label: t('overview'),
      icon: Home,
      exact: true,
    },
    {
      path: '/dashboard/courses',
      label: t('myCourses'),
      icon: BookOpen,
    },
    {
      path: '/dashboard/settings',
      label: t('accountSettings'),
      icon: Settings,
    },
  ]

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('welcomeBack')}, {user?.user_metadata?.full_name || user?.email}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('manageCoursesAccount')}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-md p-4 space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      isActive(item.path, item.exact)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/courses" element={<MyCourses />} />
              <Route path="/settings" element={<AccountSettings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard