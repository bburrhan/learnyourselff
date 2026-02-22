import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, BookOpen, GraduationCap, FileText, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import LanguageAwareLink from '../Layout/LanguageAwareLink'
import { getPathWithoutLanguage } from '../Layout/LanguageRouter'

interface TabItem {
  path: string
  icon: React.ElementType
  labelKey: string
  authRequired?: boolean
}

const TABS: TabItem[] = [
  { path: '/', icon: Home, labelKey: 'home' },
  { path: '/courses', icon: BookOpen, labelKey: 'Courses' },
  { path: '/dashboard', icon: GraduationCap, labelKey: 'myLearning', authRequired: true },
  { path: '/blog', icon: FileText, labelKey: 'blog' },
  { path: '/dashboard/account', icon: User, labelKey: 'profile', authRequired: true },
]

const BottomTabs: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()

  const currentPath = getPathWithoutLanguage(location.pathname)

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/') return currentPath === '/' || currentPath === ''
    return currentPath.startsWith(tabPath)
  }

  const visibleTabs = TABS.map((tab) => {
    if (tab.authRequired && !user) {
      if (tab.path === '/dashboard') {
        return { ...tab, path: '/login', labelKey: 'login', icon: User }
      }
      if (tab.path === '/dashboard/account') {
        return { ...tab, path: '/signup', labelKey: 'signup', icon: User }
      }
    }
    return tab
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {visibleTabs.map((tab) => {
          const active = isTabActive(tab.path)
          const Icon = tab.icon
          return (
            <LanguageAwareLink
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? 'text-royal-blue-600'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] mt-0.5 leading-tight ${active ? 'font-semibold' : 'font-normal'}`}>
                {t(tab.labelKey)}
              </span>
            </LanguageAwareLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomTabs
