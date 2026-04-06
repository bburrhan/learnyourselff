import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, Database, FORMAT_TYPES } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import logger from '../utils/logger'
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler'
import { renderMarkdown } from '../utils/renderMarkdown'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import useSeo from '../hooks/useSeo'
import {
  BookOpen,
  Download,
  Globe,
  Tag,
  ArrowLeft,
  CreditCard,
  FileText,
  Music,
  Video,
  Users,
  ShieldCheck,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']

const CourseDetail: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [hasPurchased, setHasPurchased] = useState(false)

  useSeo({
    title: course?.title,
    description: course?.description ?? undefined,
  })

  const isUuid = (val: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!slug) return

      setLoading(true)

      const result = await handleAsyncError(async () => {
        logger.info('Fetching course details', { slug })

        const query = supabase.from('courses').select('*').eq('is_active', true)
        const { data, error } = await (isUuid(slug) ? query.eq('id', slug) : query.eq('slug', slug)).maybeSingle()

        if (error) {
          handleSupabaseError(error, 'fetchCourseDetail')
        } else if (data) {
          setCourse(data)
          setError(null)
          logger.info('Found course in Supabase', { title: data.title })

          const catRes = await supabase.from('categories').select('name').eq('slug', data.category).maybeSingle()
          if (catRes.data) setCategoryName(catRes.data.name)

          return true
        }

        const localCourses = localStorage.getItem('localCourses')
        if (localCourses) {
          try {
            const parsed = JSON.parse(localCourses)
            const found = parsed.find((c: Course) => c.id === slug || c.slug === slug)
            if (found) {
              setCourse(found)
              return true
            }
          } catch (e) {
            logger.error('Error parsing local courses', { error: e }, e as Error)
          }
        }

        logger.warn('Course not found', { slug })
        setError('Course not found')
        return true
      }, 'fetchCourseDetail', false)

      if (!result) {
        logger.error('Failed to fetch course details', { slug })
        setError('Failed to fetch course')
      }

      setLoading(false)
    }

    fetchCourse()
  }, [slug, i18n.language])

  useEffect(() => {
    if (authLoading || !user || !course) return

    const checkPurchase = async () => {
      const { data } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .eq('status', 'completed')
        .limit(1)

      if (data && (data as { id: string }[]).length > 0) {
        setHasPurchased(true)
      }
    }

    checkPurchase()
  }, [authLoading, user, course])

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
            className="inline-flex items-center text-royal-blue-600 hover:text-royal-blue-700"
          >
            <ArrowLeft className="h-4 w-4 me-2" />
            {t('back')} to {t('courses')}
          </LanguageAwareLink>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'FREE'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(price)
  }

  const languageLabel: Record<string, string> = {
    en: 'English',
    tr: 'Türkçe',
    hi: 'हिन्दी',
    id: 'Indonesia',
    bn: 'বাংলা',
    vi: 'Tiếng Việt',
    ur: 'اردو',
  }

  const formatBadges = FORMAT_TYPES.filter(f =>
    course.format_types?.includes(f.value)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-x-2 text-sm">
            <LanguageAwareLink to="/" className="text-gray-500 hover:text-gray-700 transition-colors">
              {t('home')}
            </LanguageAwareLink>
            <span className="text-gray-300">/</span>
            <LanguageAwareLink to="/courses" className="text-gray-500 hover:text-gray-700 transition-colors">
              {t('Courses')}
            </LanguageAwareLink>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800 font-medium truncate max-w-xs">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Cover */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="w-52 sm:w-60 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                <div className="aspect-[3/4]">
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {categoryName || course.category}
                </span>
                {course.content_types?.includes('ebook') && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    <FileText className="h-3.5 w-3.5" /> Ebook
                  </span>
                )}
                {course.content_types?.includes('audio') && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    <Music className="h-3.5 w-3.5" /> Audio
                  </span>
                )}
                {course.content_types?.includes('video') && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    <Video className="h-3.5 w-3.5" /> Video
                  </span>
                )}
                {formatBadges.map(f => (
                  <span
                    key={f.value}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${f.bg} ${f.color} ${f.border}`}
                  >
                    {f.label}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                {course.title}
              </h1>

              {course.short_description && (
                <p className="text-lg text-gray-600 leading-relaxed mb-6 max-w-2xl">
                  {course.short_description}
                </p>
              )}

              {/* Quick stats row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-gray-400" />
                  {languageLabel[course.language] || course.language}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  {categoryName || course.category}
                </span>
              </div>

              {/* Mobile CTA (visible below lg) */}
              <div className="mt-8 flex items-center gap-4 lg:hidden">
                {!hasPurchased && (
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(course.price, course.currency)}
                    </span>
                    <p className="text-xs text-gray-500">{t('oneTimePayment')}</p>
                  </div>
                )}
                {hasPurchased ? (
                  <LanguageAwareLink
                    to={`/learn/${course.id}`}
                    className="flex-1 max-w-xs py-3 px-6 rounded-xl font-semibold text-center transition-colors bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="h-5 w-5" />
                    {t('startLearningCourse')}
                  </LanguageAwareLink>
                ) : (
                  <LanguageAwareLink
                    to={`/checkout/${course.id}`}
                    className={`flex-1 max-w-xs py-3 px-6 rounded-xl font-semibold text-center transition-colors ${
                      course.price === 0
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-royal-blue-600 text-white hover:bg-royal-blue-700'
                    }`}
                  >
                    {course.price === 0 ? t('getForFree') : t('buyNow')}
                  </LanguageAwareLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Full Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">{t('aboutCourse')}</h2>
              <div className="prose-sm">
                {renderMarkdown(course.description)}
              </div>
            </div>

            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('tags')}</h2>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors"
                    >
                      <Tag className="h-3 w-3 me-1.5 text-gray-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
              {/* Price */}
              {!hasPurchased && (
                <div className="text-center py-4 border-b border-gray-100 mb-5">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {formatPrice(course.price, course.currency)}
                  </div>
                  <p className="text-sm text-gray-500">{t('oneTimePayment')}</p>
                </div>
              )}

              {/* CTA */}
              {hasPurchased ? (
                <LanguageAwareLink
                  to={`/learn/${course.id}`}
                  className="w-full py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <PlayCircle className="h-5 w-5" />
                  {t('startLearningCourse')}
                </LanguageAwareLink>
              ) : (
                <LanguageAwareLink
                  to={`/checkout/${course.id}`}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md ${
                    course.price === 0
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-royal-blue-600 text-white hover:bg-royal-blue-700'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  {course.price === 0 ? t('getForFree') : t('buyNow')}
                </LanguageAwareLink>
              )}

              {!hasPurchased && (
                <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('moneyBackGuarantee')}
                </p>
              )}

              {/* Course meta */}
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Globe className="h-4 w-4" /> {t('language')}
                  </span>
                  <span className="font-medium text-gray-800">
                    {languageLabel[course.language] || course.language}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" /> {t('category')}
                  </span>
                  <span className="font-medium text-gray-800 capitalize">{categoryName || course.category}</span>
                </div>
              </div>
            </div>

            {/* What you'll get */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">{t('whatYouGet')}</h3>
              <ul className="space-y-3">
                {[
                  { icon: Download, label: t('instantDownload') },
                  { icon: BookOpen, label: t('completeMaterials') },
                  { icon: Users, label: t('accessCommunity') },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 p-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          {!hasPurchased && (
            <div className="flex-shrink-0">
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(course.price, course.currency)}
              </div>
              <p className="text-xs text-gray-500">{t('oneTimePayment')}</p>
            </div>
          )}
          {hasPurchased ? (
            <LanguageAwareLink
              to={`/learn/${course.id}`}
              className="w-full py-3 px-6 rounded-xl font-semibold text-center transition-colors bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center justify-center gap-2"
            >
              <PlayCircle className="h-5 w-5" />
              {t('startLearningCourse')}
            </LanguageAwareLink>
          ) : (
            <LanguageAwareLink
              to={`/checkout/${course.id}`}
              className={`flex-1 max-w-xs py-3 px-6 rounded-xl font-semibold text-center transition-colors ${
                course.price === 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-royal-blue-600 text-white hover:bg-royal-blue-700'
              }`}
            >
              {course.price === 0 ? t('getForFree') : t('buyNow')}
            </LanguageAwareLink>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  )
}

export default CourseDetail
