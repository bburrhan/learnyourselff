import React, { useEffect, useRef, useState } from 'react'
import { supabase, Database, FORMAT_TYPES, ContentType } from '../../lib/supabase'
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
  Pencil,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

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

const CONTENT_CONFIG: Record<ContentType, {
  label: string
  accept: string
  maxSize: number
  formats: string
  borderColor: string
  bgColor: string
  textColor: string
  iconBg: string
}> = {
  ebook: {
    label: 'Ebook / PDF',
    accept: 'application/pdf',
    maxSize: 50 * 1024 * 1024,
    formats: 'PDF',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50 hover:bg-blue-100/70',
    textColor: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  audio: {
    label: 'Audio',
    accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg',
    maxSize: 100 * 1024 * 1024,
    formats: 'MP3, M4A, WAV, OGG',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100/70',
    textColor: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
  },
  video: {
    label: 'Video',
    accept: 'video/mp4,video/webm,video/ogg',
    maxSize: 500 * 1024 * 1024,
    formats: 'MP4, WebM, OGG',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50 hover:bg-orange-100/70',
    textColor: 'text-orange-700',
    iconBg: 'bg-orange-100',
  },
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

interface InlineUploaderProps {
  contentId: string
  courseId: string
  contentType: ContentType
  currentFileUrl: string
  onUploaded: (contentId: string, fileUrl: string, fileName: string, fileSize: number) => void
}

const InlineUploader: React.FC<InlineUploaderProps> = ({
  contentId,
  courseId,
  contentType,
  currentFileUrl,
  onUploaded,
}) => {
  const config = CONTENT_CONFIG[contentType]
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasFile = currentFileUrl || uploadedName

  const handleFile = async (file: File) => {
    if (file.size > config.maxSize) {
      setError(`File too large. Maximum: ${formatFileSize(config.maxSize)}`)
      return
    }
    setError(null)
    setUploading(true)
    setProgress(0)
    setUploadedName(file.name)

    if (currentFileUrl) {
      const oldPath = extractStoragePath(currentFileUrl) || currentFileUrl
      await supabase.storage.from('course-files').remove([oldPath])
    }

    const ext = file.name.split('.').pop()
    const filePath = `${courseId}/${contentType}/${Date.now()}.${ext}`

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    const { error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, file, { cacheControl: '0', upsert: true })

    clearInterval(interval)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(100)
    onUploaded(contentId, filePath, file.name, file.size)
    setUploading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleChange}
        className="hidden"
      />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-blue-300 bg-blue-50'
            : hasFile
            ? 'border-green-300 bg-green-50 hover:border-blue-400'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <Upload className="h-4 w-4 animate-bounce" />
              <span>Uploading {uploadedName}...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{progress}%</p>
          </div>
        ) : hasFile ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700 truncate max-w-[240px]">
              {uploadedName || 'File uploaded — click to replace'}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">click to replace</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-0.5">
            <Upload className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Drop file or click to upload ({config.formats})
            </span>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}

const CourseDetailModal: React.FC<Props> = ({ course, onClose }) => {
  const [contents, setContents] = useState<CourseContent[]>([])
  const [loadingContents, setLoadingContents] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [openingUrl, setOpeningUrl] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchContents = async () => {
    const { data: existingContent } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true })

    if (existingContent && existingContent.length > 0) {
      setContents(existingContent)
      setLoadingContents(false)
      return
    }

    if (course.pdf_url) {
      const storagePath = extractStoragePath(course.pdf_url) || course.pdf_url
      const { data: migrated, error } = await supabase
        .from('course_content')
        .insert({
          course_id: course.id,
          content_type: 'ebook',
          title: 'Ebook / PDF',
          file_url: storagePath,
          file_name: storagePath.split('/').pop() || '',
          file_size: 0,
          sort_order: 0,
        })
        .select()
        .maybeSingle()

      if (!error && migrated) {
        await supabase.from('courses').update({ pdf_url: null }).eq('id', course.id)
        setContents([migrated])
      }
    }

    setLoadingContents(false)
  }

  useEffect(() => {
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
        window.open(fileUrlOrPath, '_blank')
        return
      }
      window.open(data.signedUrl, '_blank')
    } catch {
      window.open(fileUrlOrPath, '_blank')
    } finally {
      setOpeningUrl(null)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    setDeletingId(contentId)
    try {
      const item = contents.find(c => c.id === contentId)
      if (item?.file_url) {
        const storagePath = extractStoragePath(item.file_url) || item.file_url
        await supabase.storage.from('course-files').remove([storagePath])
      }
      const { error } = await supabase.from('course_content').delete().eq('id', contentId)
      if (error) {
        toast.error('Failed to delete content')
        return
      }
      setContents(prev => prev.filter(c => c.id !== contentId))
      setConfirmDeleteId(null)
      toast.success('Content removed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTitleChange = async (contentId: string, title: string) => {
    await supabase.from('course_content').update({ title }).eq('id', contentId)
    setContents(prev => prev.map(c => (c.id === contentId ? { ...c, title } : c)))
  }

  const handleDurationChange = async (contentId: string, val: string) => {
    const seconds = parseInt(val) || 0
    await supabase.from('course_content').update({ duration_seconds: seconds }).eq('id', contentId)
    setContents(prev => prev.map(c => (c.id === contentId ? { ...c, duration_seconds: seconds } : c)))
  }

  const handleFileUploaded = async (contentId: string, fileUrl: string, fileName: string, fileSize: number) => {
    const titleFromFile = fileName ? fileName.replace(/\.[^/.]+$/, '') : ''
    const updates: Record<string, string | number> = { file_url: fileUrl, file_name: fileName, file_size: fileSize }
    if (titleFromFile) updates.title = titleFromFile

    const { error } = await supabase.from('course_content').update(updates).eq('id', contentId)
    if (error) {
      toast.error('Failed to save file info')
      return
    }
    setContents(prev =>
      prev.map(c => (c.id === contentId ? { ...c, ...updates, file_url: fileUrl } as CourseContent : c))
    )
    toast.success('File replaced successfully')
  }

  const handleAddContent = async (type: ContentType) => {
    const existingCount = contents.filter(c => c.content_type === type).length
    const label = CONTENT_CONFIG[type].label
    const defaultTitle = existingCount === 0 ? label : `${label} ${existingCount + 1}`

    const { data, error } = await supabase
      .from('course_content')
      .insert({ course_id: course.id, content_type: type, title: defaultTitle, sort_order: contents.length })
      .select()
      .maybeSingle()

    if (error) {
      toast.error('Failed to add content item')
      return
    }
    if (data) {
      setContents(prev => [...prev, data])
      toast.success(`${label} slot added`)
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(v => !v)
                setConfirmDeleteId(null)
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isEditing
                  ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              {isEditing ? 'Done Editing' : 'Edit Files'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Content Files</p>
              {isEditing && (
                <div className="flex items-center gap-1.5">
                  {(Object.keys(CONTENT_CONFIG) as ContentType[]).map(type => {
                    const cfg = CONTENT_CONFIG[type]
                    return (
                      <button
                        key={type}
                        onClick={() => handleAddContent(type)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}
                      >
                        <Plus className="h-3 w-3" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {loadingContents ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading content files...</div>
            ) : contents.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                {isEditing ? 'Use the buttons above to add content files' : 'No content files uploaded yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {contents.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isEditing ? 'border-gray-200 bg-white shadow-sm' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {contentTypeIcon(item.content_type)}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${contentTypeBadge(item.content_type)}`}>
                              {contentTypeLabel(item.content_type)}
                            </span>
                            {item.file_name && (
                              <span className="text-xs text-gray-400 truncate max-w-[150px]">{item.file_name}</span>
                            )}
                            {item.file_size > 0 && (
                              <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(item.file_size)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {confirmDeleteId === item.id ? (
                              <>
                                <span className="text-xs text-red-600 font-medium">Delete?</span>
                                <button
                                  onClick={() => handleDeleteContent(item.id)}
                                  disabled={deletingId === item.id}
                                  className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-60 transition-colors"
                                >
                                  {deletingId === item.id ? 'Deleting...' : 'Yes, delete'}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => handleTitleChange(item.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            />
                          </div>
                          {(item.content_type === 'audio' || item.content_type === 'video') && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Duration (seconds)</label>
                              <input
                                type="number"
                                min={0}
                                value={item.duration_seconds || 0}
                                onChange={(e) => handleDurationChange(item.id, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                              />
                            </div>
                          )}
                        </div>

                        <InlineUploader
                          contentId={item.id}
                          courseId={course.id}
                          contentType={item.content_type as ContentType}
                          currentFileUrl={item.file_url}
                          onUploaded={handleFileUploaded}
                        />
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

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
