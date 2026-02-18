import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../lib/supabase'
import logger from '../utils/logger'
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Download,
  Globe,
  Tag,
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  FileText,
  Music,
  Video
} from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']

const CourseDetail: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scroll to top when component mounts or ID changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return

      const result = await handleAsyncError(async () => {
        logger.info('Fetching course details', { courseId: id })
        
        let courseData = null
        
        // Always try Supabase first, regardless of ID format
        logger.debug('Querying Supabase for course')
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single()

        logger.debug('Supabase query result', { hasData: !!data, error })

        if (error) {
          handleSupabaseError(error, 'fetchCourseDetail')
        } else if (data) {
          courseData = data
          logger.info('Found course in Supabase', { title: courseData.title })
        }
        
        // If no course found in Supabase, try mock data
        if (!courseData) {
          logger.debug('No course found in Supabase, trying mock data')
          
          // First check localStorage for locally created courses
          const localCourses = localStorage.getItem('localCourses')
          if (localCourses) {
            try {
              const parsedCourses = JSON.parse(localCourses)
              const foundLocalCourse = parsedCourses.find((course: Course) => course.id === id)
              if (foundLocalCourse) {
                logger.info('Using locally created course data', { courseId: id })
                setCourse(foundLocalCourse)
                return
              }
            } catch (e) {
              logger.error('Error parsing local courses', { error: e }, e as Error)
            }
          }
          
          // Fallback to mock course data based on ID and language
          logger.warn('Course not found', { courseId: id })
          setError('Course not found')
        }
        
        if (courseData) {
          setCourse(courseData)
          setError(null)
        }
        
        return true
      }, 'fetchCourseDetail', false)
      
      if (!result) {
        logger.error('Failed to fetch course details', { courseId: id })
        setError('Failed to fetch course')
      }
      
      setLoading(false)
    }

    fetchCourse()
  }, [id, i18n.language])

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
          <LanguageAwareLink
            to="/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')} to {t('courses')}
          </LanguageAwareLink>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) {
      return 'FREE'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <LanguageAwareLink to="/" className="text-gray-500 hover:text-gray-700">
              {t('home')}
            </LanguageAwareLink>
            <span className="text-gray-400">/</span>
            <LanguageAwareLink to="/courses" className="text-gray-500 hover:text-gray-700">
              {t('Courses')}
            </LanguageAwareLink>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 truncate">{course.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={course.cover_image_url}
                  alt={course.title}
                  className="w-full h-64 md:h-80 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {course.category}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {course.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">4.2</div>
                  <div className="text-sm text-gray-600">{t('rating')}</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Users className="h-8 w-8 text-royal-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">124</div>
                  <div className="text-sm text-gray-600">{t('students')}</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">2-3h</div>
                  <div className="text-sm text-gray-600">{t('duration')}</div>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2 gap-1">
                    {(!course.content_types || course.content_types.length === 0) ? (
                      <FileText className="h-8 w-8 text-blue-600" />
                    ) : (
                      <>
                        {course.content_types.includes('ebook') && <FileText className="h-6 w-6 text-blue-600" />}
                        {course.content_types.includes('audio') && <Music className="h-6 w-6 text-green-600" />}
                        {course.content_types.includes('video') && <Video className="h-6 w-6 text-orange-600" />}
                      </>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {course.content_types && course.content_types.length > 0 ? course.content_types.length : 1}
                  </div>
                  <div className="text-sm text-gray-600">{t('format')}</div>
                </div>
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('aboutCourse')}</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('tags')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              {/* Course Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    {t('language')}
                  </span>
                  <span className="font-medium text-gray-900">
                    {({ en: 'English', tr: 'Turkce', tl: 'Filipino', hi: 'Hindi' } as Record<string, string>)[course.language] || course.language}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t('category')}
                  </span>
                  <span className="font-medium text-gray-900">
                    {course.category}
                  </span>
                </div>
              </div>

              {/* Price Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPrice(course.price, course.currency)}
                  </div>
                  <p className="text-sm text-gray-600">{t('oneTimePayment')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <LanguageAwareLink
                  to={`/checkout/${course.id}`}
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                    course.price === 0 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-royal-blue-600 text-white hover:bg-royal-blue-700'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {course.price === 0 ? t('getForFree') : t('buyNow')}
                </LanguageAwareLink>
                
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {t('addWishlist')}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  {t('moneyBackGuarantee')}
                </p>
              </div>
            </div>

            {/* What You'll Get */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('whatYouGet')}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Download className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{t('instantDownload')}</span>
                </li>
                <li className="flex items-start">
                  <BookOpen className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{t('completeMaterials')}</span>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{t('accessCommunity')}</span>
                </li>
                <li className="flex items-start">
                  <Star className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{t('certificateCompletion')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail