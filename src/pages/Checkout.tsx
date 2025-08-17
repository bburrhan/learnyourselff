import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { createCheckoutSession } from '../lib/stripe';
import logger from '../utils/logger';
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { ArrowLeft, CreditCard, Shield, Clock } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  instructor_name: string;
  cover_image_url: string;
  category: string;
  difficulty_level: string;
}

const Checkout: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: '',
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
      setError('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      logger.info('Starting checkout process', { 
        courseId: course.id, 
        email: formData.email 
      })
      
      const { url } = await createCheckoutSession(
        course.id,
        formData.email,
        formData.fullName
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
          currency: course.currency
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
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courses
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
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
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
                    <p className="text-sm text-gray-600">by {course.instructor_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {course.category}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {course.difficulty_level}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Course Price</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${course.price} {course.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
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
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
              >
                {processing ? (
                  <>
                    <LoadingSpinner />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </form>

            {/* Security Features */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Secure Payment</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-green-600" />
                  SSL encrypted payment processing
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Instant access after payment
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