import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageAwareLink from '../../components/Layout/LanguageAwareLink'
import WhatsAppOTPInput from '../../components/UI/WhatsAppOTPInput'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { signInWithPhone } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const from = location.state?.from?.pathname || '/dashboard'

  const handleVerified = async (_phoneNumber: string) => {
    try {
      const stored = sessionStorage.getItem('whatsapp_auth')
      if (!stored) {
        toast.error('Authentication failed. Please try again.')
        return
      }
      const authData = JSON.parse(stored)
      sessionStorage.removeItem('whatsapp_auth')

      await signInWithPhone(authData.access_token, authData.refresh_token)
      toast.success(t('welcomeBack') || 'Welcome back!')
      navigate(from, { replace: true })
    } catch {
      toast.error('Failed to sign in. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <LanguageAwareLink to="/" className="flex items-center gap-x-2">
            <img
              src="/Learnyourself_Logo copy.svg"
              alt="LearnYourself Logo"
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold text-gray-900">LearnYourself</span>
          </LanguageAwareLink>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {t('login')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('dontHaveAccount') || "Don't have an account?"}{' '}
          <LanguageAwareLink
            to="/signup"
            className="font-medium text-royal-blue-600 hover:text-royal-blue-500"
          >
            {t('signup')}
          </LanguageAwareLink>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10">
          <WhatsAppOTPInput
            onVerified={handleVerified}
            purpose="login"
            language={i18n.language}
          />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400">or</span>
              </div>
            </div>

            <div className="mt-4">
              <LanguageAwareLink
                to="/courses"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                {t('browseCoursesBtn')}
              </LanguageAwareLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
