import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import { CheckCircle, BookOpen, Mail, ArrowRight, Loader } from 'lucide-react'

interface CheckoutInfo {
  courseId?: string
  courseTitle?: string
  email?: string
  fullName?: string
  amount?: number
  currency?: string
  language?: string
  isFree?: boolean
  purchaseId?: string
}

const CheckoutSuccess: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const isFree = searchParams.get('free') === 'true'

    if (isFree) {
      const storedInfo = localStorage.getItem('checkoutInfo')
      if (storedInfo) {
        setCheckoutInfo(JSON.parse(storedInfo))
        localStorage.removeItem('checkoutInfo')
      }
      return
    }

    if (sessionId) {
      const storedInfo = localStorage.getItem('checkoutInfo')
      const parsed: CheckoutInfo = storedInfo ? JSON.parse(storedInfo) : {}
      localStorage.removeItem('checkoutInfo')

      setVerifying(true)

      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          sessionId,
          language: parsed.language || i18n.language,
        }),
      })
        .then(async (res) => {
          const data = await res.json()
          if (res.ok && data.success) {
            setCheckoutInfo({
              courseId: data.course_id,
              courseTitle: data.course_title,
              email: data.email,
              fullName: data.full_name,
              amount: data.amount,
              currency: data.currency,
              language: parsed.language || i18n.language,
              isFree: false,
              purchaseId: data.purchase_id,
            })
          } else {
            setCheckoutInfo({
              ...parsed,
              isFree: false,
            })
          }
        })
        .catch(() => {
          setCheckoutInfo({
            ...parsed,
            isFree: false,
          })
        })
        .finally(() => {
          setVerifying(false)
        })
    }
  }, [])

  const sessionId = searchParams.get('session_id')

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-10 w-10 text-royal-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-medium">Confirming your purchase...</p>
          <p className="text-sm text-gray-400 mt-1">This will only take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {checkoutInfo?.isFree ? t('enrollmentSuccessful') : t('paymentSuccessful')}
          </h1>

          <p className="text-gray-600 mb-6">
            {checkoutInfo?.isFree ? t('thankYouEnrollment') : t('thankYouPurchase')}
          </p>

          {checkoutInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">{t('courseDetails')}:</h3>
              {checkoutInfo.courseTitle && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>{t('course')}:</strong> {checkoutInfo.courseTitle}
                </p>
              )}
              {checkoutInfo.email && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>{t('email')}:</strong> {checkoutInfo.email}
                </p>
              )}
              {typeof checkoutInfo.amount === 'number' && (
                <p className="text-sm text-gray-600">
                  <strong>{t('amount')}:</strong> {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: checkoutInfo.currency || 'USD',
                  }).format(checkoutInfo.amount)}
                </p>
              )}
              {checkoutInfo.isFree && (
                <p className="text-sm text-green-600 font-medium">
                  <strong>{t('courseType')}:</strong> {t('freeCourse')}
                </p>
              )}
            </div>
          )}

          <div className="bg-royal-blue-50 border border-royal-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Mail className="h-5 w-5 text-royal-blue-600 me-2" />
              <span className="font-medium text-royal-blue-900">Check Your Email</span>
            </div>
            <p className="text-sm text-royal-blue-700">
              {t('emailSentInstructions')}{' '}
              <strong>{checkoutInfo?.email || 'your email address'}</strong>
            </p>
          </div>

          {checkoutInfo?.courseId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-green-600 me-2" />
                <span className="font-medium text-green-900">{t('instantAccess')}</span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                {t('pdfReadyDownload')}
              </p>
              <LanguageAwareLink
                to={`/learn/${checkoutInfo.courseId}`}
                className="inline-flex items-center justify-center w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
              >
                <BookOpen className="h-4 w-4 me-2" />
                {t('startLearning')}
              </LanguageAwareLink>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <LanguageAwareLink
              to="/courses"
              className="w-full bg-royal-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-royal-blue-700 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
            >
              {t('browseMoreCourses')}
              <ArrowRight className="h-4 w-4 ms-2" />
            </LanguageAwareLink>

            <LanguageAwareLink
              to="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
            >
              {t('backToHome')}
            </LanguageAwareLink>
          </div>

          {sessionId && (
            <p className="text-xs text-gray-400 mt-6">
              {t('reference')}: {sessionId}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutSuccess
