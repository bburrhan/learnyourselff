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
  CreditCard
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
        const mockCoursesEn = {
          'mock-1': {
            id: 'mock-1',
            title: 'Complete Guide to Personal Finance',
            description: 'Learn how to manage your money, create budgets, and build wealth with this comprehensive guide.\n\nThis course covers:\n• Creating and sticking to a budget\n• Building an emergency fund\n• Understanding different types of investments\n• Strategies for paying off debt\n• Planning for retirement\n\nBy the end of this course, you\'ll have the knowledge and tools to take control of your financial future.',
            price: 9.99,
            currency: 'USD',
            category: 'business',
            instructor_name: 'Sarah Johnson',
            instructor_bio: 'Sarah is a certified financial planner with over 10 years of experience helping individuals and families achieve their financial goals. She has helped thousands of people get out of debt and build wealth.',
            pdf_url: 'https://example.com/finance-guide.pdf',
            cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
            tags: ['finance', 'budgeting', 'wealth', 'investing'],
            language: 'en',
            difficulty_level: 'beginner' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_featured: true,
            is_active: true,
          },
          'mock-2': {
            id: 'mock-2',
            title: 'Stress Management in 30 Minutes',
            description: 'Quick and effective techniques to reduce stress and improve your mental well-being.\n\nWhat you\'ll learn:\n• Understanding the science of stress\n• Breathing techniques for instant relief\n• Progressive muscle relaxation\n• Mindfulness exercises\n• Creating a stress-free environment\n\nThis course is designed for busy people who need practical solutions that work immediately.',
            price: 4.99,
            currency: 'USD',
            category: 'wellness',
            instructor_name: 'Dr. Michael Chen',
            instructor_bio: 'Dr. Chen is a licensed clinical psychologist and mindfulness expert with 15 years of experience. He specializes in stress management and has helped thousands of people find peace in their daily lives.',
            pdf_url: 'https://example.com/stress-management.pdf',
            cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
            tags: ['stress', 'mindfulness', 'wellness', 'meditation'],
            language: 'en',
            difficulty_level: 'beginner' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_featured: true,
            is_active: true,
          },
          'mock-3': {
            id: 'mock-3',
            title: 'Digital Marketing Basics',
            description: 'Master the fundamentals of digital marketing and grow your online presence.\n\nCourse includes:\n• Social media marketing strategies\n• Email marketing best practices\n• SEO fundamentals\n• Content creation tips\n• Analytics and measurement\n\nPerfect for entrepreneurs, small business owners, and anyone looking to improve their digital marketing skills.',
            price: 14.99,
            currency: 'USD',
            category: 'marketing',
            instructor_name: 'Elena Rodriguez',
            instructor_bio: 'Elena is a digital marketing specialist with 8 years of experience working with startups and Fortune 500 companies. She has generated millions in revenue through digital marketing campaigns.',
            pdf_url: 'https://example.com/digital-marketing.pdf',
            cover_image_url: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
            tags: ['marketing', 'social media', 'advertising', 'seo'],
            language: 'en',
            difficulty_level: 'intermediate' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_featured: false,
            is_active: true,
          }
        }
        
        const mockCoursesTr = {
          'mock-tr-1': {
            id: 'mock-tr-1',
            title: 'Kişisel Finans Rehberi',
            description: 'Paranızı nasıl yöneteceğinizi, bütçe oluşturacağınızı ve zenginlik inşa edeceğinizi öğrenin.\n\nBu kurs şunları kapsar:\n• Bütçe oluşturma ve ona bağlı kalma\n• Acil durum fonu oluşturma\n• Farklı yatırım türlerini anlama\n• Borç ödeme stratejileri\n• Emeklilik planlaması\n\nBu kursun sonunda, finansal geleceğinizi kontrol altına almak için gereken bilgi ve araçlara sahip olacaksınız.',
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
          },
          'mock-tr-2': {
            id: 'mock-tr-2',
            title: '30 Dakikada Stres Yönetimi',
            description: 'Stresi azaltmak ve zihinsel sağlığınızı iyileştirmek için hızlı ve etkili teknikler.\n\nÖğrenecekleriniz:\n• Stresin bilimini anlama\n• Anında rahatlama için nefes teknikleri\n• Aşamalı kas gevşetme\n• Mindfulness egzersizleri\n• Stressiz ortam yaratma\n\nBu kurs, hemen işe yarayan pratik çözümlere ihtiyaç duyan yoğun insanlar için tasarlanmıştır.',
            price: 4.99,
            currency: 'USD',
            category: 'wellness',
            instructor_name: 'Dr. Mehmet Özkan',
            instructor_bio: 'Lisanslı klinik psikolog ve mindfulness uzmanı',
            pdf_url: 'https://example.com/stres-yonetimi.pdf',
            cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
            tags: ['stres', 'mindfulness', 'sağlık'],
            language: 'tr',
            difficulty_level: 'beginner' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_featured: true,
            is_active: true,
          },
          'mock-tr-3': {
            id: 'mock-tr-3',
            title: 'Dijital Pazarlama Temelleri',
            description: 'Dijital pazarlamanın temellerini öğrenin ve online varlığınızı büyütün.\n\nKurs içeriği:\n• Sosyal medya pazarlama stratejileri\n• E-posta pazarlama en iyi uygulamaları\n• SEO temelleri\n• İçerik oluşturma ipuçları\n• Analitik ve ölçüm\n\nGirişimciler, küçük işletme sahipleri ve dijital pazarlama becerilerini geliştirmek isteyen herkes için mükemmel.',
            price: 14.99,
            currency: 'USD',
            category: 'marketing',
            instructor_name: 'Elif Yılmaz',
            instructor_bio: 'Startup\'lar ve Fortune 500 şirketleriyle çalışan 8 yıl deneyimli dijital pazarlama uzmanı',
            pdf_url: 'https://example.com/dijital-pazarlama.pdf',
            cover_image_url: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
            tags: ['pazarlama', 'sosyal medya', 'reklam', 'seo'],
            language: 'tr',
            difficulty_level: 'intermediate' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_featured: false,
            is_active: true,
          }
        }
        
        const mockCourses = i18n.language === 'tr' ? mockCoursesTr : mockCoursesEn
        
        if (id && mockCourses[id as keyof typeof mockCourses]) {
          setCourse(mockCourses[id as keyof typeof mockCourses])
          logger.info('Using mock course data', { courseId: id })
        } else {
          logger.warn('Course not found in mock data', { courseId: id })
          setError('Course not found')
        }
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

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                      {course.difficulty_level}
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
                  <div className="flex justify-center mb-2">
                    <Download className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">PDF</div>
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

            {/* Instructor Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('instructor')}
              </h2>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {course.instructor_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {course.instructor_name}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {course.instructor_bio}
                  </p>
                </div>
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
                    {course.language === 'tr' ? 'Türkçe' : 'English'}
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