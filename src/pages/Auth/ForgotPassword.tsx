import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import LanguageAwareLink from '../../components/Layout/LanguageAwareLink'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    try {
      console.log('Sending password reset email via Supabase for:', data.email)
      
      // Use Supabase's built-in password reset
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error('Supabase password reset error:', error)
        throw error
      }

      setEmailSent(true)
      toast.success('Password reset email sent successfully!')
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Check Your Email
              </h2>
              
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to <strong>{getValues('email')}</strong>
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                If you don't see the email in your inbox, please check your spam folder.
              </p>
              
              <div className="space-y-3">
                <LanguageAwareLink
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-royal-blue-600 hover:bg-royal-blue-700"
                >
                  Back to Login
                </LanguageAwareLink>
                
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <LanguageAwareLink to="/" className="flex items-center space-x-2">
            <img 
              src="/Learnyourself_Logo copy.svg" 
              alt="LearnYourself Logo" 
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold text-gray-900">LearnYourself</span>
          </LanguageAwareLink>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('emailAddress')}
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-royal-blue-500 focus:border-royal-blue-500 sm:text-sm"
                  placeholder="your@email.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-royal-blue-600 hover:bg-royal-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-royal-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <LanguageAwareLink
              to="/login"
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </LanguageAwareLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword