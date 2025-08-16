import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Download, Mail, ArrowRight, Home } from 'lucide-react'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Success: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Processing your purchase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-green-100 text-lg">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            <div className="space-y-8">
              {/* What's Next */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What happens next?</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Check Your Email</h3>
                    <p className="text-sm text-gray-600">
                      You'll receive a confirmation email with your purchase details within 2 minutes.
                    </p>
                  </div>

                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                      <Download className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Access Your Content</h3>
                    <p className="text-sm text-gray-600">
                      Your purchase is now available in your dashboard for immediate access.
                    </p>
                  </div>

                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Start Learning</h3>
                    <p className="text-sm text-gray-600">
                      Begin your learning journey immediately with lifetime access to your content.
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              {sessionId && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session ID:</span>
                      <span className="font-mono text-gray-900">{sessionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">Completed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 bg-royal-blue-600 text-white rounded-lg font-semibold hover:bg-royal-blue-700 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Browse More Products
                </Link>
              </div>

              {/* Support */}
              <div className="text-center pt-8 border-t border-gray-200">
                <p className="text-gray-600 mb-4">
                  Need help or have questions about your purchase?
                </p>
                <Link
                  to="/contact"
                  className="text-royal-blue-600 hover:text-royal-blue-700 font-medium"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Success