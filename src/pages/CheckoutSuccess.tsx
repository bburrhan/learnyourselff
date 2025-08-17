import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import { CheckCircle, Download, Mail, ArrowRight } from 'lucide-react'

const CheckoutSuccess: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    // Get checkout info from localStorage
    const isSuccess = searchParams.get('success') === 'true'
    const isFree = searchParams.get('free') === 'true'
    
    if (isSuccess || isFree) {
      const storedInfo = localStorage.getItem('checkoutInfo')
      if (storedInfo) {
        setCheckoutInfo(JSON.parse(storedInfo))
        if (isFree) {
          // toast.success('Free course enrolled successfully! Check your email for access instructions.')
        } else {
          // toast.success(isDemo ? 'Demo purchase completed! In production, you would receive an email with download links.' : 'Purchase completed successfully!')
        }
        // Clear the stored info
        localStorage.removeItem('checkoutInfo')
      }
    }
  }, [])

  const sessionId = searchParams.get('session_id')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {checkoutInfo?.isFree ? t('enrollmentSuccessful') : t('paymentSuccessful')}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {checkoutInfo?.isFree ? t('thankYouEnrollment') : t('thankYouPurchase')}
          </p>

          {/* Course Info */}
          {checkoutInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">{t('courseDetails')}:</h3>
              <p className="text-sm text-gray-600 mb-1">
                <strong>{t('course')}:</strong> {checkoutInfo.courseTitle}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>{t('email')}:</strong> {checkoutInfo.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>{t('amount')}:</strong> {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: checkoutInfo.currency || 'USD',
                }).format(checkoutInfo.amount)}
              </p>
            </div>
          )}

          {/* Email Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Check Your Email</span>
            </div>
            <p className="text-sm text-blue-700">
              {t('emailSentInstructions')}{' '}
              <strong>{checkoutInfo?.email || 'your email address'}</strong>
            </p>
          </div>

          {/* Download Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Download className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900">Instant Access</span>
            </div>
            <p className="text-sm text-green-700">
              {t('pdfReadyDownload')}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <LanguageAwareLink
              to="/courses"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
            >
              {t('browseMoreCourses')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </LanguageAwareLink>
            
            <LanguageAwareLink
              to="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              {t('backToHome')}
            </LanguageAwareLink>
          </div>

          {/* Session ID for reference */}
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