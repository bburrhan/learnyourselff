import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database, ContentType } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import LanguageAwareLink from '../../components/Layout/LanguageAwareLink'
import logger from '../../utils/logger'
import { handleSupabaseError, handleAsyncError } from '../../utils/errorHandler'
import {
  Calendar,
  ExternalLink,
  FileText,
  Music,
  Video,
  PlayCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import { format } from 'date-fns'

type Purchase = Database['public']['Tables']['purchases']['Row'] & {
  courses: Database['public']['Tables']['courses']['Row']
}

type UserProgress = Database['public']['Tables']['user_progress']['Row']

interface CourseProgressMap {
  [courseId: string]: {
    totalItems: number
    completedItems: number
    overallPercent: number
    lastAccessed: string | null
  }
}

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  ebook: <FileText className="h-3.5 w-3.5" />,
  audio: <Music className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
}

const CONTENT_COLORS: Record<ContentType, string> = {
  ebook: 'bg-blue-50 text-blue-600',
  audio: 'bg-green-50 text-green-600',
  video: 'bg-orange-50 text-orange-600',
}

const MyCourses: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [progressMap, setProgressMap] = useState<CourseProgressMap>({})
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      const result = await handleAsyncError(async () => {
        logger.info('Fetching user purchases', { userId: user.id })

        const { data: purchaseData, error } = await supabase
          .from('purchases')
          .select(`*, courses!inner (*)`)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .eq('courses.language', i18n.language)
          .order('created_at', { ascending: false })

        if (error) {
          handleSupabaseError(error, 'fetchUserPurchases')
          throw error
        }

        setPurchases(purchaseData || [])

        const courseIds = (purchaseData || []).map((p: Purchase) => p.course_id)

        if (courseIds.length > 0) {
          const [progressRes, contentRes] = await Promise.all([
            supabase
              .from('user_progress')
              .select('*')
              .eq('user_id', user.id)
              .in('course_id', courseIds),
            supabase
              .from('course_content')
              .select('id, course_id')
              .in('course_id', courseIds)
              .eq('is_active', true),
          ])

          const progressData: UserProgress[] = progressRes.data || []
          const contentData = contentRes.data || []

          const counts: Record<string, number> = {}
          contentData.forEach((c) => {
            counts[c.course_id] = (counts[c.course_id] || 0) + 1
          })
          setContentCounts(counts)

          const pMap: CourseProgressMap = {}
          courseIds.forEach((cid: string) => {
            const courseProgress = progressData.filter((p) => p.course_id === cid)
            const totalItems = counts[cid] || 0
            const completedItems = courseProgress.filter((p) => p.completed).length
            const overallPercent =
              courseProgress.length > 0
                ? Math.round(
                    courseProgress.reduce((sum, p) => sum + p.progress_percent, 0) /
                      Math.max(totalItems, courseProgress.length)
                  )
                : 0
            const lastAccessed = courseProgress.length > 0
              ? courseProgress.sort(
                  (a, b) =>
                    new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()
                )[0].last_accessed_at
              : null

            pMap[cid] = { totalItems, completedItems, overallPercent, lastAccessed }
          })
          setProgressMap(pMap)
        }

        return true
      }, 'fetchUserPurchases', false)

      if (!result) {
        logger.warn('Failed to fetch purchases')
        setPurchases([])
      }

      setLoading(false)
    }

    fetchData()
  }, [user, i18n.language])

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{t('myCourses')}</h2>
        <p className="text-gray-500 mt-1 text-sm">{t('accessDownload')}</p>
      </div>

      <div className="p-6">
        {purchases.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCoursesPurchased')}</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Start learning by purchasing your first course
            </p>
            <LanguageAwareLink
              to="/courses"
              className="inline-flex items-center px-5 py-2.5 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-colors font-medium text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('browseCoursesBtn')}
            </LanguageAwareLink>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const course = purchase.courses
              const progress = progressMap[course.id]
              const totalContent = contentCounts[course.id] || 0
              const hasStarted = progress && progress.overallPercent > 0
              const isComplete = progress && progress.completedItems === progress.totalItems && progress.totalItems > 0

              return (
                <div
                  key={purchase.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0 relative overflow-hidden">
                      <img
                        src={course.cover_image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src =
                            'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'
                        }}
                      />
                      {isComplete && (
                        <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-1" />
                            <span className="text-xs font-medium">Complete</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-royal-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3">
                            by {course.instructor_name}
                          </p>

                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            {course.content_types &&
                              course.content_types.map((type) => (
                                <span
                                  key={type}
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${CONTENT_COLORS[type]}`}
                                >
                                  {CONTENT_ICONS[type]}
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                              ))}
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>

                        <div className="hidden sm:block text-right flex-shrink-0">
                          {course.price === 0 ? (
                            <span className="text-sm font-semibold text-green-600">FREE</span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-700">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: purchase.currency || 'USD',
                              }).format(purchase.amount)}
                            </span>
                          )}
                        </div>
                      </div>

                      {totalContent > 0 && progress && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-500">
                              {progress.completedItems} of {progress.totalItems} items completed
                            </span>
                            <span className="font-medium text-gray-700">
                              {progress.overallPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isComplete ? 'bg-green-500' : 'bg-royal-blue-500'
                              }`}
                              style={{ width: `${progress.overallPercent}%` }}
                            />
                          </div>
                          {progress.lastAccessed && (
                            <p className="text-xs text-gray-400 mt-1">
                              Last accessed{' '}
                              {format(new Date(progress.lastAccessed), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {totalContent > 0 ? (
                          <LanguageAwareLink
                            to={`/learn/${course.id}`}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isComplete
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : hasStarted
                                  ? 'bg-royal-blue-600 text-white hover:bg-royal-blue-700 shadow-sm'
                                  : 'bg-royal-blue-600 text-white hover:bg-royal-blue-700 shadow-sm'
                            }`}
                          >
                            {isComplete ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Review Course
                              </>
                            ) : hasStarted ? (
                              <>
                                <PlayCircle className="h-4 w-4" />
                                Continue Learning
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4" />
                                Start Learning
                              </>
                            )}
                          </LanguageAwareLink>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No content available yet
                          </span>
                        )}
                        <LanguageAwareLink
                          to={`/course/${course.id}`}
                          className="text-sm text-gray-500 hover:text-royal-blue-600 transition-colors"
                        >
                          View Details
                        </LanguageAwareLink>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCourses
