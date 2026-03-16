import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface LanguageRouterProps {
  children: React.ReactNode
}

const SUPPORTED_LANGUAGES = ['en', 'tr', 'tl', 'hi', 'id', 'bn', 'vi', 'ur']
const DEFAULT_LANGUAGE = 'en'
const RTL_LANGUAGES = ['ur', 'ar', 'he', 'fa']

export const isRTL = (lang: string): boolean => RTL_LANGUAGES.includes(lang)

const applyDirection = (lang: string) => {
  const dir = isRTL(lang) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lang
}

export const LanguageRouter: React.FC<LanguageRouterProps> = ({ children }) => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const langFromUrl = pathSegments[0]

    if (SUPPORTED_LANGUAGES.includes(langFromUrl)) {
      if (i18n.language !== langFromUrl) {
        i18n.changeLanguage(langFromUrl)
      }
      applyDirection(langFromUrl)
    } else {
      const currentLang = i18n.language || DEFAULT_LANGUAGE
      applyDirection(currentLang)
      const newPath = `/${currentLang}${location.pathname}${location.search}`
      navigate(newPath, { replace: true })
    }
  }, [location.pathname, i18n, navigate])

  // Listen for language changes and update URL
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      applyDirection(lng)
      const pathSegments = location.pathname.split('/').filter(Boolean)
      const currentLangFromUrl = pathSegments[0]

      if (SUPPORTED_LANGUAGES.includes(currentLangFromUrl)) {
        pathSegments[0] = lng
        const newPath = `/${pathSegments.join('/')}${location.search}`
        navigate(newPath, { replace: true })
      } else {
        const newPath = `/${lng}${location.pathname}${location.search}`
        navigate(newPath, { replace: true })
      }
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => i18n.off('languageChanged', handleLanguageChange)
  }, [location, navigate, i18n])

  return <>{children}</>
}

export const getCurrentLanguageFromUrl = (): string => {
  const pathSegments = window.location.pathname.split('/').filter(Boolean)
  const langFromUrl = pathSegments[0]
  
  if (SUPPORTED_LANGUAGES.includes(langFromUrl)) {
    return langFromUrl
  }
  
  return DEFAULT_LANGUAGE
}

export const getPathWithoutLanguage = (pathname: string): string => {
  const pathSegments = pathname.split('/').filter(Boolean)
  const langFromUrl = pathSegments[0]
  
  if (SUPPORTED_LANGUAGES.includes(langFromUrl)) {
    return '/' + pathSegments.slice(1).join('/')
  }
  
  return pathname
}

export const createLanguageLink = (path: string, language?: string): string => {
  const lang = language || getCurrentLanguageFromUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `/${lang}${cleanPath}`
}