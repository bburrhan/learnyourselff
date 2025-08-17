import React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, Globe, Heart, Bug } from 'lucide-react'
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
              className="flex items-center space-x-2 mb-4 cursor-pointer"
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
            <div className="flex space-x-4 pt-2">
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
            <h3 className="text-lg font-semibold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-gray-400 hover:text-white transition-colors">
                  {t('Courses')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses?category=technology" className="text-gray-400 hover:text-white transition-colors">
                  Technology
                </Link>
              </li>
              <li>
                <Link to="/courses?category=business" className="text-gray-400 hover:text-white transition-colors">
                  Business
                </Link>
              </li>
              <li>
                <Link to="/courses?category=design" className="text-gray-400 hover:text-white transition-colors">
                  Design
                </Link>
              </li>
              <li>
                <Link to="/courses?category=marketing" className="text-gray-400 hover:text-white transition-colors">
                  Marketing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-400 hover:text-white transition-colors">
                  {t('helpCenter')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  {t('privacy')} Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  {t('terms')} of Service
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-gray-400 hover:text-white transition-colors">
                  {t('refundPolicy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm">
            © 2025 LearnYourself.co. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center order-first md:order-last">
            Made with <Heart className="h-4 w-4 text-red-500 mx-1" /> for learners worldwide
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