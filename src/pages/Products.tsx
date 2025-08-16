import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { stripeProducts } from '../stripe-config'
import { useAuth } from '../hooks/useAuth'
import { useStripeCheckout } from '../hooks/useStripeCheckout'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { CreditCard, Check, Star, Shield } from 'lucide-react'

const Products: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { createCheckoutSession, loading } = useStripeCheckout()
  const [processingProductId, setProcessingProductId] = useState<string | null>(null)

  const handlePurchase = async (productId: string, priceId: string) => {
    setProcessingProductId(productId)
    try {
      await createCheckoutSession(priceId, 'payment')
    } catch (error) {
      console.error('Purchase error:', error)
    } finally {
      setProcessingProductId(null)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('products')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your learning journey. All products include lifetime access and instant delivery.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {stripeProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="p-8">
                {/* Product Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-royal-blue-100 rounded-full mb-4">
                    <Star className="h-8 w-8 text-royal-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600">
                    {product.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {formatPrice(product.price, product.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    One-time payment
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Instant access after purchase</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Lifetime access</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Email delivery within 2 minutes</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">30-day money-back guarantee</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(product.id, product.priceId)}
                  disabled={loading || processingProductId === product.id}
                  className="w-full bg-royal-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-royal-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {processingProductId === product.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      {t('buyNow')}
                    </>
                  )}
                </button>
              </div>

              {/* Security Badge */}
              <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2" />
                  {t('securedByStripe')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-royal-blue-50 border border-royal-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-royal-blue-900 mb-2">
              Need Help Choosing?
            </h3>
            <p className="text-royal-blue-700 mb-4">
              All products come with our 30-day money-back guarantee. If you're not satisfied, we'll refund your purchase.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center text-royal-blue-600 hover:text-royal-blue-700 font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products