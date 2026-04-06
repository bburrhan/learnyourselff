import React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react'

const NotFound: React.FC = () => {
  const { t } = useTranslation()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
          <div className="text-gray-400">
            <Search className="h-16 w-16 mx-auto" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{t('pageNotFound')}</h1>
          <p className="text-gray-600">
            {t('sorryPageNotFound')}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LanguageAwareLink
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-colors font-semibold"
            >
              <Home className="h-4 w-4 mr-2" />
              {t('goHome')}
            </LanguageAwareLink>
            
            <LanguageAwareLink
              to="/courses"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-royal-blue-600 text-royal-blue-600 rounded-lg hover:bg-royal-blue-600 hover:text-white transition-colors font-semibold"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t('browseCoursesBtn')}
            </LanguageAwareLink>
          </div>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('goBack')}
          </button>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('popularPages')}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <LanguageAwareLink
              to="/courses"
              className="text-gray-600 hover:text-royal-blue-600 transition-colors"
            >
              {t('allCourses')}
            </LanguageAwareLink>
            <LanguageAwareLink
              to="/blog"
              className="text-gray-600 hover:text-royal-blue-600 transition-colors"
            >
              {t('blog')}
            </LanguageAwareLink>
            <LanguageAwareLink
              to="/about"
              className="text-gray-600 hover:text-royal-blue-600 transition-colors"
            >
              {t('about')}
            </LanguageAwareLink>
            <LanguageAwareLink
              to="/contact"
              className="text-gray-600 hover:text-royal-blue-600 transition-colors"
            >
              {t('contact')}
            </LanguageAwareLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound