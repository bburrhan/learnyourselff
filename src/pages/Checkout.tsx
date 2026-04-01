import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import logger from '../utils/logger';
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import WhatsAppOTPInput from '../components/UI/WhatsAppOTPInput';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle, Smartphone } from 'lucide-react';

const enrollFreeCourse = async (
  courseId: string,
  phoneNumber: string,
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
      phoneNumber,
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

const Checkout: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, getPhoneNumber } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const phoneNumber = getPhoneNumber();
  const isPhoneUser = !!phoneNumber;

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const fullNameRef = useRef(fullName);
  fullNameRef.current = fullName;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(prev => prev || user.user_metadata?.full_name || '');
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

  const validateName = () => {
    if (!fullNameRef.current.trim()) {
      setNameError(t('fillAllFields'));
      return false;
    }
    setNameError(null);
    return true;
  };

  const handlePhoneVerified = async (phone: string) => {
    const stored = sessionStorage.getItem('whatsapp_auth');
    if (stored) {
      sessionStorage.removeItem('whatsapp_auth');
    }
    await processCheckout(phone);
  };

  const processCheckout = async (phone: string) => {
    if (!course) return;

    const effectivePhone = phone;
    const effectiveName = fullNameRef.current;

    setProcessing(true);
    setError(null);

    try {
      if (course.price === 0) {
        const result = await enrollFreeCourse(
          course.id,
          effectivePhone,
          effectiveName,
          i18n.language
        );

        localStorage.setItem('checkoutInfo', JSON.stringify({
          courseId: course.id,
          courseTitle: result.course_title || course.title,
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
        `phone:${effectivePhone}`,
        effectiveName,
        i18n.language
      );

      if (url) {
        localStorage.setItem('checkoutInfo', JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
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
    }
  };

  const handleAuthenticatedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateName()) return;
    if (!phoneNumber) return;
    await processCheckout(phoneNumber);
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

          {/* Checkout Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {processing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner />
                <p className="text-gray-600">{t('processing')}</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('customerInformation')}</h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (e.target.value.trim()) setNameError(null);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent ${
                        nameError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={t('fullName')}
                    />
                    {nameError && (
                      <p className="text-xs text-red-600 mt-1">{nameError}</p>
                    )}
                  </div>

                  {/* Authenticated phone user */}
                  {isPhoneUser ? (
                    <form onSubmit={handleAuthenticatedCheckout} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                          <Smartphone className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{phoneNumber}</span>
                          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 text-sm">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={processing || !fullName.trim()}
                        className={`w-full text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 ${
                          course?.price === 0
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-royal-blue-600 hover:bg-royal-blue-700'
                        }`}
                      >
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
                      </button>
                    </form>
                  ) : (
                    /* Guest user — inline OTP */
                    <div className="space-y-4">
                      <WhatsAppOTPInput
                        onVerified={handlePhoneVerified}
                        onBeforeSend={validateName}
                        purpose="checkout"
                        language={i18n.language}
                        loading={processing}
                      />

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-800 text-sm">{error}</p>
                        </div>
                      )}
                    </div>
                  )}
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
