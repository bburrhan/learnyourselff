import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { User, Phone, Globe, Save, MessageCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  languagePreference: z.string(),
})

type ProfileForm = z.infer<typeof profileSchema>

const AccountSettings: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, getPhoneNumber } = useAuth()
  const [loading, setLoading] = useState(false)

  const phoneNumber = getPhoneNumber()
  const isPhoneUser = !!phoneNumber
  const displayEmail = user?.email?.includes('@noemail.learnyourself.app') ? null : user?.email

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      languagePreference: i18n.language,
    },
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: data.fullName },
      })

      if (error) throw error

      i18n.changeLanguage(data.languagePreference)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <User className="h-5 w-5 text-gray-400 me-2" />
          <h2 className="text-xl font-semibold text-gray-900">{t('profileSettings')}</h2>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          {isPhoneUser ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageCircle className="inline h-4 w-4 me-1 text-green-600" />
                WhatsApp Number
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 text-sm">{phoneNumber}</span>
                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Verified via WhatsApp</p>
            </div>
          ) : displayEmail ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emailAddress')}
              </label>
              <input
                type="email"
                value={displayEmail}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">{t('emailCannotChange')}</p>
            </div>
          ) : null}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('fullName')}
            </label>
            <input
              {...profileForm.register('fullName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent"
            />
            {profileForm.formState.errors.fullName && (
              <p className="mt-1 text-sm text-red-600">
                {profileForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="languagePreference" className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="inline h-4 w-4 me-1" />
              {t('languagePreference')}
            </label>
            <select
              {...profileForm.register('languagePreference')}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
              <option value="hi">हिन्दी</option>
              <option value="id">Indonesia</option>
              <option value="bn">বাংলা</option>
              <option value="vi">Tiếng Việt</option>
              <option value="ur">اردو</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-royal-blue-600 text-white rounded-xl hover:bg-royal-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              t('saving')
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                {t('saveProfile')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AccountSettings
