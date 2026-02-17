import React, { useState, useEffect } from 'react'
import { FileText, Music, Video, Trash2, GripVertical, CheckCircle2 } from 'lucide-react'
import { supabase, Database, ContentType } from '../../lib/supabase'
import FileUploader from '../UI/FileUploader'
import toast from 'react-hot-toast'

type CourseContent = Database['public']['Tables']['course_content']['Row']

interface ContentManagerProps {
  courseId: string
  onContentTypesChange: (types: ContentType[]) => void
}

const CONTENT_CONFIG: Record<ContentType, {
  label: string
  description: string
  icon: React.ReactNode
  accept: string
  maxSize: number
  maxSizeLabel: string
  formats: string
  bgColor: string
  borderColor: string
  textColor: string
  iconBg: string
}> = {
  ebook: {
    label: 'Ebook / PDF',
    description: 'Upload a PDF document for reading',
    icon: <FileText className="h-5 w-5" />,
    accept: 'application/pdf',
    maxSize: 50 * 1024 * 1024,
    maxSizeLabel: '50 MB',
    formats: 'PDF',
    bgColor: 'bg-blue-50 hover:bg-blue-100/70',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  audio: {
    label: 'Audio',
    description: 'Upload an audio file for listening',
    icon: <Music className="h-5 w-5" />,
    accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg',
    maxSize: 100 * 1024 * 1024,
    maxSizeLabel: '100 MB',
    formats: 'MP3, M4A, WAV, OGG',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100/70',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
  },
  video: {
    label: 'Video',
    description: 'Upload a video file for watching',
    icon: <Video className="h-5 w-5" />,
    accept: 'video/mp4,video/webm,video/ogg',
    maxSize: 500 * 1024 * 1024,
    maxSizeLabel: '500 MB',
    formats: 'MP4, WebM, OGG',
    bgColor: 'bg-orange-50 hover:bg-orange-100/70',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    iconBg: 'bg-orange-100',
  },
}

const ContentManager: React.FC<ContentManagerProps> = ({ courseId, onContentTypesChange }) => {
  const [contents, setContents] = useState<CourseContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContents()
  }, [courseId])

  const fetchContents = async () => {
    const { data } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })

    const items = data || []
    setContents(items)
    updateContentTypes(items)
    setLoading(false)
  }

  const updateContentTypes = (items: CourseContent[]) => {
    const types = [...new Set(items.filter(i => i.is_active).map(i => i.content_type))] as ContentType[]
    onContentTypesChange(types)
  }

  const handleAddContent = async (type: ContentType) => {
    const { data, error } = await supabase
      .from('course_content')
      .insert({
        course_id: courseId,
        content_type: type,
        title: CONTENT_CONFIG[type].label,
        sort_order: contents.length,
      })
      .select()
      .maybeSingle()

    if (error) {
      toast.error('Failed to add content item')
      return
    }

    if (data) {
      const updated = [...contents, data]
      setContents(updated)
      updateContentTypes(updated)
    }
  }

  const handleFileUploaded = async (contentId: string, fileUrl: string, fileName: string, fileSize: number) => {
    const { error } = await supabase
      .from('course_content')
      .update({ file_url: fileUrl, file_name: fileName, file_size: fileSize })
      .eq('id', contentId)

    if (error) {
      toast.error('Failed to save file info')
      return
    }

    setContents(prev =>
      prev.map(c => (c.id === contentId ? { ...c, file_url: fileUrl, file_name: fileName, file_size: fileSize } : c))
    )
    toast.success('File uploaded')
  }

  const handleTitleChange = async (contentId: string, title: string) => {
    await supabase.from('course_content').update({ title }).eq('id', contentId)
    setContents(prev => prev.map(c => (c.id === contentId ? { ...c, title } : c)))
  }

  const handleDurationChange = async (contentId: string, duration: string) => {
    const seconds = parseInt(duration) || 0
    await supabase.from('course_content').update({ duration_seconds: seconds }).eq('id', contentId)
    setContents(prev => prev.map(c => (c.id === contentId ? { ...c, duration_seconds: seconds } : c)))
  }

  const handleDelete = async (contentId: string) => {
    if (!window.confirm('Remove this content item?')) return

    const item = contents.find(c => c.id === contentId)
    if (item?.file_url) {
      await supabase.storage.from('course-files').remove([item.file_url])
    }

    await supabase.from('course_content').delete().eq('id', contentId)
    const updated = contents.filter(c => c.id !== contentId)
    setContents(updated)
    updateContentTypes(updated)
    toast.success('Content removed')
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const existingTypes = contents.map(c => c.content_type)
  const availableTypes = (Object.keys(CONTENT_CONFIG) as ContentType[]).filter(t => !existingTypes.includes(t))

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Loading content...</div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">Course Content Files</h3>
        <p className="text-xs text-gray-500">
          Add up to one file per type. Click a card below to add that content type.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(CONTENT_CONFIG) as ContentType[]).map(type => {
          const config = CONTENT_CONFIG[type]
          const isAdded = existingTypes.includes(type)

          return (
            <button
              key={type}
              type="button"
              disabled={isAdded}
              onClick={() => handleAddContent(type)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                isAdded
                  ? `${config.borderColor} ${config.bgColor.split(' ')[0]} opacity-75 cursor-default`
                  : `${config.borderColor} ${config.bgColor} cursor-pointer border-dashed`
              }`}
            >
              {isAdded && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className={`h-4 w-4 ${config.textColor}`} />
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center ${config.textColor}`}>
                {config.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${config.textColor}`}>{config.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isAdded ? 'Added' : config.formats}
                </p>
                {!isAdded && (
                  <p className="text-[11px] text-gray-400">Max {config.maxSizeLabel}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {contents.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-400">
          Click a card above to start adding content
        </div>
      )}

      <div className="space-y-3">
        {contents.map(item => {
          const config = CONTENT_CONFIG[item.content_type as ContentType]
          return (
            <div key={item.id} className={`border rounded-xl p-4 bg-white ${config.borderColor}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300" />
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.iconBg} ${config.textColor}`}>
                    {config.icon}
                    {config.label}
                  </span>
                  {item.file_size > 0 && (
                    <span className="text-xs text-gray-400">{formatSize(item.file_size)}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleTitleChange(item.id, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {(item.content_type === 'audio' || item.content_type === 'video') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.duration_seconds}
                      onChange={(e) => handleDurationChange(item.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <FileUploader
                bucket="course-files"
                path={`${courseId}/${item.content_type}`}
                accept={config.accept}
                maxSize={config.maxSize}
                currentFileUrl={item.file_url}
                label="Upload File"
                onUploadComplete={(url, name, size) => handleFileUploaded(item.id, url, name, size)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ContentManager
