import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import logger from '../utils/logger';
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  cover_image_url: string;
  category: string;
}

const Checkout: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        email: prev.email || user.email || '',
        fullName: prev.fullName || user.user_metadata?.full_name || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!courseId) {
      navigate('/courses');
      return;
    }

    fetchCourse();
  }, [courseId, navigate]);

  const fetchCourse = async () => {
    const result = await handleAsyncError(async () => {
      logger.info('Fetching course for checkout', { courseId })
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        if (error) {
          handleSupabaseError(error, 'fetchCourseForCheckout')
        }
        throw new Error('Course not found');
      }

      logger.info('Course fetched for checkout', { courseId, title: data.title })
      setCourse(data);
      return true
    }, 'fetchCourseForCheckout', false)
    
    if (!result) {
      setError('Failed to load course');
    }
    
    setLoading(false);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course || !formData.email || !formData.fullName) {
      logger.warn('Checkout validation failed', { 
        hasCourse: !!course, 
        hasEmail: !!formData.email, 
        hasFullName: !!formData.fullName 
      })
      setError(t('fillAllFields'));
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create user account if not logged in
      let userId = user?.id
      
      if (!user) {
        logger.info('Creating user account for anonymous purchase', { email: formData.email })
        
        // Generate a secure random password
        const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: password,
          options: {
            data: {
              full_name: formData.fullName,
              language_preference: i18n.language,
            },
          },
        })
        
        if (signUpError) {
          logger.error('Failed to create user account', { error: signUpError })
          throw signUpError
        }
        
        userId = signUpData.user?.id
        logger.info('Created user account for purchase', { userId, email: formData.email })
      }

      // Handle free courses - create purchase record and send email
      if (course.price === 0) {
        logger.info('Processing free course enrollment', { 
          courseId: course.id, 
          email: formData.email,
          userId 
        })
        
        // Create purchase record for free course
        const purchaseData = {
          user_id: userId,
          course_id: course.id,
          email: formData.email,
          stripe_payment_id: `free_${Date.now()}`, // Special identifier for free courses
          amount: 0,
          currency: course.currency,
          status: 'completed' as const,
        }

        const { data: purchaseResult, error: purchaseError } = await supabase
          .from('purchases')
          .insert([purchaseData])
          .select()
          .single()

        if (purchaseError) {
          logger.error('Failed to create free course purchase record', { error: purchaseError })
          throw purchaseError
        }

        logger.info('Free course purchase record created', { purchaseId: purchaseResult.id })

        const courseUrl = `${window.location.origin}/${i18n.language}/learn/${course.id}`

        const emailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-course-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            purchaseId: purchaseResult.id,
            email: formData.email,
            fullName: formData.fullName,
            courseTitle: course.title,
            courseId: course.id,
            courseUrl,
            isFree: true,
            language: i18n.language,
          }),
        })

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json()
          logger.error('Failed to send course email', { error: emailError })
          throw new Error('Failed to send course materials')
        }

        logger.info('Course email sent successfully', { email: formData.email })

        // Store checkout info for success page
        localStorage.setItem('checkoutInfo', JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          email: formData.email,
          fullName: formData.fullName,
          amount: 0,
          currency: course.currency,
          language: i18n.language,
          isFree: true,
          purchaseId: purchaseResult.id,
        }));
        
        // Redirect directly to success page
        navigate(`/checkout/success?free=true&course_id=${course.id}`);
        return;
      }

      // Handle paid courses - proceed with Stripe checkout
      logger.info('Starting checkout process', { 
        courseId: course.id, 
        email: formData.email,
        userId 
      })
      
      const { url } = await createCheckoutSession(
        course.id,
        formData.email,
        formData.fullName,
        i18n.language
      );

      if (url) {
        logger.info('Redirecting to Stripe checkout', { url })
        // Store checkout info in localStorage for success page
        localStorage.setItem('checkoutInfo', JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          email: formData.email,
          fullName: formData.fullName,
          amount: course.price,
          currency: course.currency,
          language: i18n.language
        }));
        window.location.href = url;
      } else {
        logger.error('No checkout URL received from Stripe')
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      logger.error('Checkout process failed', { 
        courseId: course.id, 
        email: formData.email, 
        error: err 
      }, err as Error)
      setError(err instanceof Error ? err.message : 'Failed to process checkout');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('courseNotFound')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-royal-blue-600 text-white px-6 py-2 rounded-lg hover:bg-royal-blue-700 transition-colors"
          >
            {t('backToCourses')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToCourse')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('completePurchaseTitle')}</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('orderSummary')}</h2>
            
            {course && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-royal-blue-100 text-royal-blue-800 text-xs rounded-full">
                        {course.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('coursePrice')}</span>
                    <span className={`text-2xl font-bold ${course.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {course.price === 0 ? 'FREE' : new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency || 'USD' }).format(course.price)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('customerInformation')}</h2>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  readOnly={!!user}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent ${user ? 'bg-gray-50 text-gray-600 cursor-default' : ''}`}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent"
                  placeholder={t('fullName')}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={processing || !formData.email || !formData.fullName}
                className={`w-full text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 ${
                  course?.price === 0 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-royal-blue-600 hover:bg-royal-blue-700'
                }`}
              >
                {processing ? (
                  <>
                    <LoadingSpinner />
                    Processing...
                  </>
                ) : (
                  <>
                    {course?.price === 0 ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        {t('enrollForFree')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        {t('proceedToPayment')}
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            {/* Security Features */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-3">{t('securePayment')}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-600" />
                  {t('sslEncrypted')}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {t('instantAccess')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;