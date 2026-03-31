import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageAwareLink from '../../components/Layout/LanguageAwareLink'
import WhatsAppOTPInput from '../../components/UI/WhatsAppOTPInput'
import toast from 'react-hot-toast'

const Signup: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { signInWithPhone } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
      toast.success(t('accountCreated') || 'Account created successfully!')
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Failed to create account. Please try again.')
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
          {t('signup')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
          <LanguageAwareLink
            to="/login"
            className="font-medium text-royal-blue-600 hover:text-royal-blue-500"
          >
            {t('login')}
          </LanguageAwareLink>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setNameError('') }}
                placeholder="John Doe"
                autoComplete="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent text-sm"
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-600">{nameError}</p>
              )}
            </div>

            <WhatsAppOTPInput
              onVerified={handleVerified}
              purpose="signup"
              language={i18n.language}
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t('bySigningUp') || 'By signing up, you agree to our'}{' '}
              <LanguageAwareLink to="/terms" className="text-royal-blue-600 hover:text-royal-blue-500">
                {t('termsOfService') || 'Terms of Service'}
              </LanguageAwareLink>{' '}
              {t('and') || 'and'}{' '}
              <LanguageAwareLink to="/privacy" className="text-royal-blue-600 hover:text-royal-blue-500">
                {t('privacyPolicy') || 'Privacy Policy'}
              </LanguageAwareLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
