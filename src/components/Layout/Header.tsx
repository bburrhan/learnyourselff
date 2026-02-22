import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { isNative } from '../../utils/platform'
import LanguageAwareLink from './LanguageAwareLink'
import { getPathWithoutLanguage } from './LanguageRouter'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'tr', label: 'Turkce', short: 'TR', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'tl', label: 'Filipino', short: 'TL', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'hi', label: 'Hindi', short: 'HI', flag: '\u{1F1EE}\u{1F1F3}' },
]

const Header: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangDropdownOpen(false)
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setLangDropdownOpen(false)
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

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const navLinks = [
    { path: '/', label: t('home') },
    { path: '/courses', label: t('Courses') },
    { path: '/blog', label: t('blog') },
  ]

  return (
    <header
      className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-gray-100"
      style={{ paddingTop: isNative() ? 'env(safe-area-inset-top, 0px)' : undefined }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <LanguageAwareLink to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img
              src="/Learnyourself_Logo copy.svg"
              alt="LearnYourself Logo"
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">LearnYourself</span>
          </LanguageAwareLink>

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

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                aria-expanded={langDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
                className="flex items-center space-x-1.5 text-gray-700 hover:text-royal-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="text-sm font-medium">{currentLang.short}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg py-1 border border-gray-100 z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-2.5 ${
                        i18n.language === lang.code
                          ? 'bg-royal-blue-50 text-royal-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center space-x-2 text-gray-700 hover:text-royal-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium truncate max-w-32">{user.email}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-50">
                    <LanguageAwareLink
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('dashboard')}
                    </LanguageAwareLink>
                    {user?.app_metadata?.role === 'admin' && (
                      <LanguageAwareLink
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {t('admin')}
                      </LanguageAwareLink>
                    )}
                    <button
                      onClick={() => { setUserDropdownOpen(false); handleSignOut(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
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

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

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
                <div className="px-4 py-2 mb-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Language</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code)
                          setMobileMenuOpen(false)
                        }}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors text-left flex items-center space-x-2 ${
                          i18n.language === lang.code
                            ? 'bg-royal-blue-50 text-royal-blue-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base leading-none">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

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
                    {user?.app_metadata?.role === 'admin' && (
                      <LanguageAwareLink
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:text-royal-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span>{t('admin')}</span>
                      </LanguageAwareLink>
                    )}
                    {user?.app_metadata?.role === 'admin' && (
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
