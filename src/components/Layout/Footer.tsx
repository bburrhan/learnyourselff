import React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Globe, Heart, Bug } from 'lucide-react'
import LanguageAwareLink from './LanguageAwareLink'
import DebugPanel from '../Debug/DebugPanel'

const Footer: React.FC = () => {
  const { t } = useTranslation()
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)
  const [debugClickCount, setDebugClickCount] = useState(0)

  // Secret debug panel activation (click logo 5 times in development)
  const handleLogoClick = () => {
    if (import.meta.env.DEV) {
      setDebugClickCount(prev => prev + 1)
      if (debugClickCount >= 4) {
        setDebugPanelOpen(true)
        setDebugClickCount(0)
      }
    }
  }

  return (
    <>
      <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div
              className="flex items-center gap-x-2 mb-4 cursor-pointer"
              onClick={handleLogoClick}
            >
              <img 
                src="/Learnyourself_Logo copy.svg" 
                alt="LearnYourself Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-white">LearnYourself</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Democratizing access to quality education through affordable digital courses.
            </p>
            <div className="flex gap-x-4 pt-2">
              <div className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                <Mail className="h-5 w-5 text-gray-400 hover:text-royal-blue-400 transition-colors" />
              </div>
              <div className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                <Globe className="h-5 w-5 text-gray-400 hover:text-royal-blue-400 transition-colors" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <LanguageAwareLink to="/courses" className="text-gray-400 hover:text-white transition-colors">
                  {t('Courses')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  {t('blog')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/about" className="text-gray-400 hover:text-white transition-colors">
                  {t('about')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  {t('contact')}
                </LanguageAwareLink>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">{t('categories')}</h3>
            <ul className="space-y-2">
              <li>
                <LanguageAwareLink to="/courses?category=technology" className="text-gray-400 hover:text-white transition-colors">
                  {t('technology')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/courses?category=business" className="text-gray-400 hover:text-white transition-colors">
                  {t('business')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/courses?category=design" className="text-gray-400 hover:text-white transition-colors">
                  {t('design')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/courses?category=marketing" className="text-gray-400 hover:text-white transition-colors">
                  {t('marketing')}
                </LanguageAwareLink>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">{t('support')}</h3>
            <ul className="space-y-2">
              <li>
                <LanguageAwareLink to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  {t('contact')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  {t('privacy')}
                </LanguageAwareLink>
              </li>
              <li>
                <LanguageAwareLink to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  {t('terms')}
                </LanguageAwareLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-y-4 md:gap-y-0">
          <p className="text-gray-400 text-sm">
            © 2025 LearnYourself.co. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-x-1 order-first md:order-last">
            Made with <Heart className="h-4 w-4 text-red-500" /> for learners worldwide
          </p>
        </div>
      </div>
    </footer>
      
      <DebugPanel 
        isOpen={debugPanelOpen} 
        onClose={() => setDebugPanelOpen(false)} 
      />
    </>
  )
}

export default Footer