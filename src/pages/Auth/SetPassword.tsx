import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import LanguageAwareLink from '../../components/Layout/LanguageAwareLink'
import { Eye, EyeOff, ShieldCheck, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const setPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SetPasswordForm = z.infer<typeof setPasswordSchema>

const SetPassword: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
  })

  useEffect(() => {
    const init = async () => {
      const paramEmail = searchParams.get('email') || ''
      const storedData = localStorage.getItem('pendingSetPassword')
      const parsed = storedData ? JSON.parse(storedData) : null

      const targetEmail = paramEmail || parsed?.email || ''
      setEmail(targetEmail)

      if (!targetEmail || !parsed?.tempPassword) {
        setInitializing(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
        setInitializing(false)
        return
      }

      const attemptSignIn = async (retries: number): Promise<boolean> => {
        const { error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: parsed.tempPassword,
        })
        if (!error) return true
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1500))
          return attemptSignIn(retries - 1)
        }
        return false
      }

      const success = await attemptSignIn(2)
      if (success) {
        setSessionReady(true)
      }

      setInitializing(false)
    }

    init()
  }, [searchParams])

  const onSubmit = async (data: SetPasswordForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      localStorage.removeItem('pendingSetPassword')
      toast.success(t('passwordSetSuccess'))
      navigate(`/${i18n.language}/dashboard/my-courses`, { replace: true })
    } catch {
      toast.error(t('passwordSetError'))
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <ShieldCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('createYourPassword')}</h1>
          <p className="text-gray-600 mb-6">{t('setPasswordSessionExpiredDesc')}</p>
          <div className="flex flex-col gap-3">
            <LanguageAwareLink
              to="/login"
              className="w-full bg-royal-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-royal-blue-700 transition-colors flex items-center justify-center"
            >
              {t('login')}
            </LanguageAwareLink>
            <LanguageAwareLink
              to="/forgot-password"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              {t('changePassword')}
            </LanguageAwareLink>
          </div>
        </div>
      </div>
    )
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
          {t('createYourPassword')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('createPasswordDesc')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">{t('purchaseComplete')}</span>
            </div>
            <p className="text-sm text-green-700">{t('setPasswordToAccess')}</p>
          </div>

          {email && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-600 cursor-default sm:text-sm"
              />
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('newPassword')}
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="appearance-none block w-full px-3 py-2 pe-10 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-royal-blue-500 focus:border-royal-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 end-0 pe-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('confirmNewPassword')}
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="appearance-none block w-full px-3 py-2 pe-10 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-royal-blue-500 focus:border-royal-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 end-0 pe-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-royal-blue-600 hover:bg-royal-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-royal-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? t('processing') : t('setPasswordAndAccess')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SetPassword
