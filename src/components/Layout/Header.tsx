import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Globe, Menu, X, Bug } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import LanguageAwareLink from './LanguageAwareLink'
import { getPathWithoutLanguage } from './LanguageRouter'
import { useState } from 'react'

const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : 'en'
    i18n.changeLanguage(newLang)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/', label: t('home') },
    { path: '/courses', label: t('Courses') },
    { path: '/blog', label: t('blog') },
  ]

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <LanguageAwareLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img 
              src="/Learnyourself_Logo copy.svg" 
              alt="LearnYourself Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">LearnYourself</span>
          </LanguageAwareLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <LanguageAwareLink
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  isActive(getPathWithoutLanguage(location.pathname)) && getPathWithoutLanguage(location.pathname) === link.path
                    ? 'text-royal-blue-600 bg-royal-blue-50'
                    : 'text-gray-700 hover:text-royal-blue-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </LanguageAwareLink>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-gray-700 hover:text-royal-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">
                {i18n.language.toUpperCase()}
              </span>
            </button>

            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-royal-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium truncate max-w-32">{user.email}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                  <LanguageAwareLink
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('dashboard')}
                  </LanguageAwareLink>
                  {user?.user_metadata?.role === 'admin' && (
                    <LanguageAwareLink
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('admin')}
                    </LanguageAwareLink>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <LanguageAwareLink
                  to="/login"
                  className="text-gray-700 hover:text-royal-blue-600 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  {t('login')}
                </LanguageAwareLink>
                <LanguageAwareLink
                  to="/signup"
                  className="bg-royal-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-royal-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  {t('signup')}
                </LanguageAwareLink>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <LanguageAwareLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 text-base font-medium transition-colors rounded-lg mx-2 ${
                    isActive(getPathWithoutLanguage(location.pathname)) && getPathWithoutLanguage(location.pathname) === link.path
                      ? 'text-royal-blue-600 bg-royal-blue-50 font-semibold'
                      : 'text-gray-700 hover:text-royal-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </LanguageAwareLink>
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-4 mx-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-royal-blue-600 w-full text-left rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>{i18n.language.toUpperCase()}</span>
                </button>
                
                {user ? (
                  <div className="space-y-2">
                    <LanguageAwareLink
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-royal-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>{t('dashboard')}</span>
                    </LanguageAwareLink>
                    {user?.user_metadata?.role === 'admin' && (
                      <LanguageAwareLink
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-royal-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span>{t('admin')}</span>
                      </LanguageAwareLink>
                    )}
                    {user?.user_metadata?.role === 'admin' && (
                      <LanguageAwareLink
                        to="/admin/blogs"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-royal-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span>Blog Management</span>
                      </LanguageAwareLink>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-royal-blue-600 w-full text-left rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <LanguageAwareLink
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-gray-700 hover:text-royal-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t('login')}
                    </LanguageAwareLink>
                    <LanguageAwareLink
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-colors font-medium text-center"
                    >
                      {t('signup')}
                    </LanguageAwareLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header