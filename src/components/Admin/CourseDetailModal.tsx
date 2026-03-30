import React, { useEffect, useState } from 'react'
import { supabase, Database, FORMAT_TYPES } from '../../lib/supabase'
import {
  X,
  BookOpen,
  FileText,
  Music,
  Video,
  Download,
  ExternalLink,
  Tag,
  Calendar,
  Globe,
  DollarSign,
  Clock,
  Copy,
  Check,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'

type Course = Database['public']['Tables']['courses']['Row']
type CourseContent = Database['public']['Tables']['course_content']['Row']

interface Props {
  course: Course
  onClose: () => void
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const contentTypeIcon = (type: string) => {
  if (type === 'ebook') return <FileText className="h-4 w-4 text-blue-600" />
  if (type === 'audio') return <Music className="h-4 w-4 text-emerald-600" />
  return <Video className="h-4 w-4 text-orange-600" />
}

const contentTypeBadge = (type: string) => {
  if (type === 'ebook') return 'bg-blue-50 text-blue-700 border-blue-100'
  if (type === 'audio') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  return 'bg-orange-50 text-orange-700 border-orange-100'
}

const contentTypeLabel = (type: string) => {
  if (type === 'ebook') return 'PDF / Ebook'
  if (type === 'audio') return 'Audio'
  return 'Video'
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

function extractStoragePath(url: string): string | null {
  try {
    const marker = '/storage/v1/object/public/course-files/'
    const idx = url.indexOf(marker)
    if (idx !== -1) return url.slice(idx + marker.length)
    const signedMarker = '/storage/v1/object/sign/course-files/'
    const idx2 = url.indexOf(signedMarker)
    if (idx2 !== -1) {
      const afterMarker = url.slice(idx2 + signedMarker.length)
      return afterMarker.split('?')[0]
    }
    if (!url.startsWith('http') && !url.startsWith('/')) return url
    return null
  } catch {
    return null
  }
}

function isStoragePath(url: string): boolean {
  if (!url) return false
  if (url.includes(`${SUPABASE_URL}/storage`)) return true
  if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('blob:')) return true
  return false
}

const CourseDetailModal: React.FC<Props> = ({ course, onClose }) => {
  const [contents, setContents] = useState<CourseContent[]>([])
  const [loadingContents, setLoadingContents] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [openingUrl, setOpeningUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchContents = async () => {
      const { data } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_order', { ascending: true })
      setContents(data || [])
      setLoadingContents(false)
    }
    fetchContents()
  }, [course.id])

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {
      // fallback
    }
  }

  const openSignedUrl = async (fileUrlOrPath: string, download = false) => {
    setOpeningUrl(fileUrlOrPath)
    try {
      const path = extractStoragePath(fileUrlOrPath) || fileUrlOrPath
      const { data, error } = await supabase.storage
        .from('course-files')
        .createSignedUrl(path, 3600, { download })
      if (error || !data?.signedUrl) {
        console.error('Signed URL error:', error)
        window.open(fileUrlOrPath, '_blank')
        return
      }
      window.open(data.signedUrl, '_blank')
    } catch (e) {
      console.error('openSignedUrl error:', e)
      window.open(fileUrlOrPath, '_blank')
    } finally {
      setOpeningUrl(null)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm')
    } catch {
      return dateStr
    }
  }

  const formatTypes = course.format_types || []
  const tags = course.tags || []

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Course Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-5">
            <div className="flex-shrink-0">
              {course.cover_image_url ? (
                <img
                  src={course.cover_image_url}
                  alt={course.title}
                  className="w-24 h-32 rounded-xl object-cover shadow-md"
                />
              ) : (
                <div className="w-24 h-32 rounded-xl bg-gray-100 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">{course.title}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border mt-0.5 ${course.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
                {course.is_featured && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 mt-0.5">
                    Featured
                  </span>
                )}
              </div>
              {course.slug && (
                <p className="text-sm text-gray-400 mt-0.5">/{course.slug}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">Category:</span>
                  <span className="text-gray-700">{course.category}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">Language:</span>
                  <span className="text-gray-700 uppercase">{course.language}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">Price:</span>
                  <span className={`font-semibold ${course.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {course.price === 0
                      ? 'Free'
                      : new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency }).format(course.price)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">Created:</span>
                  <span className="text-gray-700">{formatDate(course.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">Updated:</span>
                  <span className="text-gray-700">{formatDate(course.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {course.cover_image_url && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cover Image URL</p>
              <UrlRow url={course.cover_image_url} copiedUrl={copiedUrl} onCopy={copyToClipboard} />
            </div>
          )}

          {formatTypes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Format Types</p>
              <div className="flex flex-wrap gap-1.5">
                {formatTypes.map((ft) => {
                  const cfg = FORMAT_TYPES.find(f => f.value === ft)
                  if (!cfg) return null
                  return (
                    <span key={ft} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {course.short_description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Short Description</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">{course.short_description}</p>
            </div>
          )}

          {course.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Description</p>
              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {course.description}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Content Files</p>
            {loadingContents ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading content files...</div>
            ) : contents.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No content files uploaded yet
              </div>
            ) : (
              <div className="space-y-2">
                {contents.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="mt-0.5">{contentTypeIcon(item.content_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{item.title || item.file_name || 'Untitled'}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${contentTypeBadge(item.content_type)}`}>
                          {contentTypeLabel(item.content_type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {item.file_name && (
                          <span className="text-xs text-gray-400 truncate max-w-[200px]">{item.file_name}</span>
                        )}
                        {item.file_size > 0 && (
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(item.file_size)}</span>
                        )}
                        {item.duration_seconds > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDuration(item.duration_seconds)}
                          </span>
                        )}
                      </div>
                      {item.file_url && (
                        <div className="mt-2">
                          <UrlRow url={item.file_url} copiedUrl={copiedUrl} onCopy={copyToClipboard} onOpen={isStoragePath(item.file_url) ? openSignedUrl : undefined} />
                        </div>
                      )}
                    </div>
                    {item.file_url && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openSignedUrl(item.file_url)}
                          disabled={openingUrl === item.file_url}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-lg transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {openingUrl === item.file_url ? 'Opening...' : 'View'}
                        </button>
                        <button
                          onClick={() => openSignedUrl(item.file_url, true)}
                          disabled={openingUrl === item.file_url}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 rounded-lg transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {course.pdf_url && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">PDF File</p>
              <UrlRow url={course.pdf_url} copiedUrl={copiedUrl} onCopy={copyToClipboard} onOpen={openSignedUrl} />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openSignedUrl(course.pdf_url!)}
                  disabled={openingUrl === course.pdf_url}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 rounded-lg transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {openingUrl === course.pdf_url ? 'Opening...' : 'View PDF'}
                </button>
                <button
                  onClick={() => openSignedUrl(course.pdf_url!, true)}
                  disabled={openingUrl === course.pdf_url}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface UrlRowProps {
  url: string
  copiedUrl: string | null
  onCopy: (url: string) => void
  onOpen?: (url: string) => void
}

const UrlRow: React.FC<UrlRowProps> = ({ url, copiedUrl, onCopy, onOpen }) => {
  const isCopied = copiedUrl === url
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
      <span className="text-xs text-gray-500 truncate flex-1 font-mono">{url}</span>
      <button
        onClick={() => onCopy(url)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 transition-colors"
        title="Copy URL"
      >
        {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {onOpen ? (
        <button
          onClick={() => onOpen(url)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}

export default CourseDetailModal
