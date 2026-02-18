import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, Database, ContentType } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useProgress, useCourseProgress } from '../../hooks/useProgress'
import AudioPlayer from '../../components/Player/AudioPlayer'
import VideoPlayer from '../../components/Player/VideoPlayer'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { ArrowLeft, FileText, Music, Video, CheckCircle, Download, Clock } from 'lucide-react'
import { createLanguageLink } from '../../components/Layout/LanguageRouter'
import toast from 'react-hot-toast'

type Course = Database['public']['Tables']['courses']['Row']
type CourseContent = Database['public']['Tables']['course_content']['Row']

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  ebook: <FileText className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
}

const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [contents, setContents] = useState<CourseContent[]>([])
  const [activeContentId, setActiveContentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  const activeContent = contents.find(c => c.id === activeContentId)
  const { lastPosition, progressPercent, saveProgress, markCompleted } = useProgress(
    courseId || '',
    activeContentId
  )
  const { progressList, overallPercent, getContentProgress } = useCourseProgress(courseId || '')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!courseId || !user) return

    const fetchData = async () => {
      const [courseRes, contentRes, purchaseRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
        supabase
          .from('course_content')
          .select('*')
          .eq('course_id', courseId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('status', 'completed')
          .limit(1),
      ])

      setCourse(courseRes.data)
      setContents(contentRes.data || [])

      const isFree = courseRes.data?.price === 0
      const hasPurchase = (purchaseRes.data?.length || 0) > 0
      setHasAccess(isFree || hasPurchase)

      if (contentRes.data && contentRes.data.length > 0) {
        setActiveContentId(contentRes.data[0].id)
      }

      setLoading(false)
    }

    fetchData()
  }, [courseId, user])

  const getSignedUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('course-files')
      .createSignedUrl(filePath, 3600)
    if (error || !data?.signedUrl) {
      toast.error('Failed to load file')
      return ''
    }
    return data.signedUrl
  }

  const handleDownloadEbook = async (content: CourseContent) => {
    const url = await getSignedUrl(content.file_url)
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = content.file_name || 'course.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    markCompleted()
    toast.success('Download started!')
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 60) {
      const h = Math.floor(m / 60)
      return `${h}h ${m % 60}m`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return <LoadingSpinner className="py-24" />

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('courseNotFound')}</h2>
          <button
            onClick={() => navigate(createLanguageLink('/courses'))}
            className="text-royal-blue-600 hover:text-royal-blue-700"
          >
            {t('backToCourses')}
          </button>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600 mb-4">You need to purchase this course to access the content.</p>
          <button
            onClick={() => navigate(createLanguageLink(`/course/${courseId}`))}
            className="px-4 py-2 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-colors"
          >
            {t('backToCourse')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(createLanguageLink('/dashboard/courses'))}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{course.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">{overallPercent}% complete</div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-royal-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Course Content</h3>
                <p className="text-xs text-gray-500 mt-0.5">{contents.length} items</p>
              </div>
              <div className="divide-y divide-gray-100">
                {contents.map(item => {
                  const progress = getContentProgress(item.id)
                  const isActive = item.id === activeContentId
                  const isComplete = progress?.completed

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveContentId(item.id)}
                      className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                        isActive ? 'bg-royal-blue-50 border-l-2 border-royal-blue-600' : 'hover:bg-gray-50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${isComplete ? 'text-green-500' : 'text-gray-400'}`}>
                        {isComplete ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          CONTENT_ICONS[item.content_type as ContentType]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? 'font-medium text-royal-blue-900' : 'text-gray-700'}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 capitalize">{item.content_type}</span>
                          {item.duration_seconds > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDuration(item.duration_seconds)}
                            </span>
                          )}
                        </div>
                        {progress && !isComplete && progress.progress_percent > 0 && (
                          <div className="w-full h-1 bg-gray-200 rounded-full mt-1.5">
                            <div
                              className="h-full bg-royal-blue-500 rounded-full"
                              style={{ width: `${progress.progress_percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 order-1 lg:order-2">
            {activeContent ? (
              <ContentViewer
                content={activeContent}
                lastPosition={lastPosition}
                progressPercent={progressPercent}
                onProgressUpdate={saveProgress}
                onDownload={handleDownloadEbook}
                getSignedUrl={getSignedUrl}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-500">Select content from the sidebar to start learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ContentViewerProps {
  content: CourseContent
  lastPosition: number
  progressPercent: number
  onProgressUpdate: (seconds: number, percent: number) => void
  onDownload: (content: CourseContent) => void
  getSignedUrl: (path: string) => Promise<string>
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  lastPosition,
  onProgressUpdate,
  onDownload,
  getSignedUrl,
}) => {
  const [mediaUrl, setMediaUrl] = useState('')
  const [loadingUrl, setLoadingUrl] = useState(false)

  useEffect(() => {
    if (content.content_type !== 'ebook' && content.file_url) {
      setLoadingUrl(true)
      getSignedUrl(content.file_url).then(url => {
        setMediaUrl(url)
        setLoadingUrl(false)
      })
    }
    return () => setMediaUrl('')
  }, [content.id, content.file_url])

  if (content.content_type === 'ebook') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-royal-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-royal-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h3>
          <p className="text-gray-500 mb-6">
            Download the ebook to read at your own pace.
          </p>
          <button
            onClick={() => onDownload(content)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Download PDF
          </button>
          {content.file_name && (
            <p className="text-xs text-gray-400 mt-3">{content.file_name}</p>
          )}
        </div>
      </div>
    )
  }

  if (loadingUrl) {
    return <LoadingSpinner className="py-24" />
  }

  if (!mediaUrl) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No file uploaded for this content yet.</p>
      </div>
    )
  }

  if (content.content_type === 'audio') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.title}</h3>
          <AudioPlayer
            src={mediaUrl}
            title={content.title}
            initialPosition={lastPosition}
            onProgressUpdate={onProgressUpdate}
          />
        </div>
        {lastPosition > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Resuming from where you left off
          </p>
        )}
      </div>
    )
  }

  if (content.content_type === 'video') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <VideoPlayer
            src={mediaUrl}
            title={content.title}
            initialPosition={lastPosition}
            onProgressUpdate={onProgressUpdate}
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
          </div>
        </div>
        {lastPosition > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Resuming from where you left off
          </p>
        )}
      </div>
    )
  }

  return null
}

export default CourseLearning
