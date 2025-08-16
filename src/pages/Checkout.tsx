import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase, Database } from '../lib/supabase'
import { stripePromise, createCheckoutSession } from '../lib/stripe'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { CreditCard, Lock, ArrowLeft, User, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

type Course = Database['public']['Tables']['courses']['Row']

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

const Checkout: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      fullName: user?.user_metadata?.full_name || '',
    },
  })

  useEffect(() => {
    if (user) {
      setValue('email', user.email || '')
      setValue('fullName', user.user_metadata?.full_name || '')
    }
  }, [user, setValue])

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .eq('is_active', true)
          .single()

        console.log('Checkout - Supabase query result:', { data, error, courseId })

        if (error) throw error

        setCourse(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Course not found')
        
        // Provide mock course data filtered by language
        const mockCoursesEn = [
          {
            id: 'mock-1',
            title: 'Complete Guide to Personal Finance',
            description: 'Learn how to manage your money, create budgets, and build wealth.',
            price: 9.99,
            currency: 'USD',
            category: 'business',
            instructor_name: 'Sarah Johnson',
            instructor_bio: 'Financial advisor with 10+ years of experience',
            pdf_url: 'https://example.com/finance-guide.pdf',
            cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
            tags: ['finance', 'budgeting', 'wealth'],
            language: 'en',
            difficulty_level: 'beginner' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_featured: true,
            is_active: true,
          }
        ]
        
        const mockCoursesTr = [
          {
            id: 'mock-tr-1',
            title: 'Kişisel Finans Rehberi',
            description: 'Paranızı nasıl yöneteceğinizi, bütçe oluşturacağınızı ve zenginlik inşa edeceğinizi öğrenin.',
            price: 9.99,
            currency: 'USD',
            category: 'business',
            instructor_name: 'Ayşe Demir',
            instructor_bio: '10+ yıl deneyimli finansal danışman',
            pdf_url: 'https://example.com/finans-rehberi.pdf',
            cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
            tags: ['finans', 'bütçe', 'zenginlik'],
            language: 'tr',
            difficulty_level: 'beginner' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_featured: true,
            is_active: true,
          }
        ]
        
        const mockCourses = i18n.language === 'tr' ? mockCoursesTr : mockCoursesEn
        const foundCourse = mockCourses.find(course => course.id === courseId)
        
        if (foundCourse) {
          setCourse(foundCourse)
          setError(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId, i18n.language])

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }

  const handleStripeCheckout = async (data: CheckoutForm) => {
    if (!course) return

    setProcessing(true)
    try {
      console.log('Starting checkout process...')
      console.log('Stripe configured:', !!stripePromise)
      
      // Create checkout session using the utility function
      const session = await createCheckoutSession(course.id, data.email, data.fullName)

      console.log('Checkout session created:', session)

      // Check if this is demo mode
      if (session.demo) {
        // Demo mode - simulate successful purchase
        toast.success('Demo mode: Purchase simulated successfully!')
        
        // Create a mock purchase record
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert([
            {
              course_id: course.id,
              email: data.email,
              stripe_payment_id: 'demo_' + Math.random().toString(36).substr(2, 9),
              amount: course.price,
              currency: course.currency,
              status: 'completed',
              user_id: user?.id || null,
            }
          ])

        if (purchaseError) {
          console.error('Error creating demo purchase:', purchaseError)
        }

        // Redirect to success page
        navigate(`/dashboard?success=true&demo=true`)
        return
      }

      if (session.error) {
        throw new Error(session.error)
      }

      // Real Stripe integration
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe not loaded')

      console.log('Redirecting to Stripe checkout...')
      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error(err instanceof Error ? err.message : 'Payment failed')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('error')}</h1>
          <p className="text-gray-600 mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/course/${course.id}`)}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToCourse')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('checkout')}</h1>
          <p className="text-gray-600 mt-2">{t('completePurchase')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {user ? t('confirmDetails') : t('guestCheckout')}
            </h2>

            <form onSubmit={handleSubmit(handleStripeCheckout)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  {t('email')}
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  {t('fullName')}
                </label>
                <input
                  {...register('fullName')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-royal-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-royal-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      {t('completePayment')}
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center text-sm text-gray-500">
                <Lock className="h-4 w-4 mr-1" />
                {t('securedByStripe')}
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('orderSummary')}</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <img
                  src={course.cover_image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'}
                  alt={course.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.category}</p>
                  <p className="text-sm text-gray-500">by {course.instructor_name}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('subtotal')}</span>
                  <span className="font-medium">{formatPrice(course.price, course.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('tax')}</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                  <span>{t('total')}</span>
                  <span className="text-royal-blue-600">{formatPrice(course.price, course.currency)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t('whatYouGet')}:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• {t('instantDownload')}</li>
                  <li>• Lifetime access</li>
                  <li>• Email delivery within 2 minutes</li>
                  <li>• {t('moneyBackGuarantee')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-royal-blue-50 border border-royal-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-royal-blue-600 mr-2" />
            <p className="text-sm text-royal-blue-800">
              Your payment information is processed securely by Stripe. We never store your card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout