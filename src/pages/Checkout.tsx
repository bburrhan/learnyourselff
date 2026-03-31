import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import logger from '../utils/logger';
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import WhatsAppOTPInput from '../components/UI/WhatsAppOTPInput';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle, MessageCircle } from 'lucide-react';

const enrollFreeCourse = async (
  courseId: string,
  phoneNumber: string | null,
  email: string | null,
  fullName: string,
  language: string
) => {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enroll-free-course`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      courseId,
      phoneNumber: phoneNumber || undefined,
      email: email || undefined,
      fullName,
      language,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to enroll in free course');
  }
  return data;
};

interface Course {
  id: string;
  title: string;
  slug: string | null;
  description: string;
  price: number;
  currency: string;
  cover_image_url: string;
  category: string;
  categoryName?: string;
}

type CheckoutStep = 'info' | 'verify' | 'processing';

const Checkout: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, getPhoneNumber } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<CheckoutStep>('info');
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  const phoneNumber = getPhoneNumber();
  const isPhoneUser = !!phoneNumber;

  const [formData, setFormData] = useState({
    email: user?.email?.includes('@noemail.learnyourself.app') ? '' : (user?.email || ''),
    fullName: user?.user_metadata?.full_name || '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        email: prev.email || (user.email?.includes('@noemail.learnyourself.app') ? '' : (user.email || '')),
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
      logger.info('Fetching course for checkout', { courseId });

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        if (error) handleSupabaseError(error, 'fetchCourseForCheckout');
        throw new Error('Course not found');
      }

      const { data: catData } = await supabase
        .from('categories')
        .select('name')
        .eq('slug', data.category)
        .maybeSingle();

      setCourse({ ...data, categoryName: catData?.name });
      return true;
    }, 'fetchCourseForCheckout', false);

    if (!result) setError('Failed to load course');
    setLoading(false);
  };

  const handlePhoneVerified = async (phone: string) => {
    setVerifiedPhone(phone);
    const stored = sessionStorage.getItem('whatsapp_auth');
    if (stored) {
      sessionStorage.removeItem('whatsapp_auth');
    }
    await processCheckout(phone, null);
  };

  const processCheckout = async (phone: string | null, emailOverride: string | null) => {
    if (!course) return;

    const effectivePhone = phone ?? phoneNumber ?? verifiedPhone;
    const effectiveEmail = emailOverride ?? formData.email;
    const effectiveName = formData.fullName;

    setProcessing(true);
    setError(null);
    setStep('processing');

    try {
      if (course.price === 0) {
        const result = await enrollFreeCourse(
          course.id,
          effectivePhone,
          effectivePhone ? null : effectiveEmail,
          effectiveName,
          i18n.language
        );

        localStorage.setItem('checkoutInfo', JSON.stringify({
          courseId: course.id,
          courseTitle: result.course_title || course.title,
          email: effectiveEmail,
          phoneNumber: effectivePhone,
          fullName: effectiveName,
          amount: 0,
          currency: course.currency,
          language: i18n.language,
          isFree: true,
          purchaseId: result.purchase_id,
          isNewUser: result.is_new_user,
        }));

        navigate(`/checkout/success?free=true&course_id=${course.id}`);
        return;
      }

      const { url } = await createCheckoutSession(
        course.id,
        effectivePhone ? `phone:${effectivePhone}` : effectiveEmail,
        effectiveName,
        i18n.language
      );

      if (url) {
        localStorage.setItem('checkoutInfo', JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          email: effectiveEmail,
          phoneNumber: effectivePhone,
          fullName: effectiveName,
          amount: course.price,
          currency: course.currency,
          language: i18n.language,
          isNewUser: !user,
        }));
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      logger.error('Checkout process failed', { courseId: course.id, error: err }, err as Error);
      setError(err instanceof Error ? err.message : 'Failed to process checkout');
      setProcessing(false);
      setStep('info');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course || !formData.fullName) {
      setError(t('fillAllFields'));
      return;
    }

    if (!isPhoneUser && !formData.email) {
      setError(t('fillAllFields'));
      return;
    }

    if (!user && !isPhoneUser) {
      setStep('verify');
      return;
    }

    await processCheckout(phoneNumber, null);
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
        <div className="mb-8">
          <button
            onClick={() => navigate(`/course/${course?.slug || courseId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 me-2" />
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
                      <span className="px-2 py-1 bg-royal-blue-100 text-royal-blue-800 text-xs rounded-full capitalize">
                        {course.categoryName || course.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('coursePrice')}</span>
                    <span className={`text-2xl font-bold ${course.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {course.price === 0
                        ? 'FREE'
                        : new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency || 'USD' }).format(course.price)
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Form / OTP Verification */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {step === 'verify' ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Verify Your Identity</h2>
                  <p className="text-sm text-gray-500">We need to verify your phone number to complete the purchase.</p>
                </div>
                <WhatsAppOTPInput
                  onVerified={handlePhoneVerified}
                  purpose="checkout"
                  language={i18n.language}
                />
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Go back
                </button>
              </div>
            ) : step === 'processing' ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner />
                <p className="text-gray-600">{t('processing')}</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('customerInformation')}</h2>

                <form onSubmit={handleCheckout} className="space-y-4">
                  {isPhoneUser ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{phoneNumber}</span>
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('emailAddress')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        readOnly={!!user && !user.email?.includes('@noemail.learnyourself.app')}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent ${
                          user && !user.email?.includes('@noemail.learnyourself.app')
                            ? 'bg-gray-50 text-gray-600 cursor-default'
                            : ''
                        }`}
                        placeholder="your@email.com"
                      />
                    </div>
                  )}

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

                  {!user && !isPhoneUser && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <MessageCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-700">
                        You'll verify your identity via WhatsApp before completing the purchase.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={processing || !formData.fullName || (!isPhoneUser && !formData.email)}
                    className={`w-full text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 ${
                      course?.price === 0
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-royal-blue-600 hover:bg-royal-blue-700'
                    }`}
                  >
                    {processing ? (
                      <>
                        <LoadingSpinner />
                        {t('processing')}
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
                            {!user && !isPhoneUser ? 'Verify & Pay' : t('proceedToPayment')}
                          </>
                        )}
                      </>
                    )}
                  </button>
                </form>

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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
