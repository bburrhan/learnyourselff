import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageAwareLink from '../../components/Layout/LanguageAwareLink'
import { getPathWithoutLanguage } from '../../components/Layout/LanguageRouter'
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
    const currentPathWithoutLang = getPathWithoutLanguage(location.pathname)
    if (exact) {
      return currentPathWithoutLang === path
    }
    return currentPathWithoutLang.startsWith(path)
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
          {/* Sidebar - mobile horizontal scroll, desktop vertical */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-md p-4">
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <LanguageAwareLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:whitespace-normal ${
                        isActive(item.path, item.exact)
                          ? 'bg-royal-blue-50 text-royal-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </LanguageAwareLink>
                  )
                })}
              </div>
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