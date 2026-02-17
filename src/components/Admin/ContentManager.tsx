import React, { useState, useEffect } from 'react'
import { FileText, Music, Video, Trash2, GripVertical, Plus } from 'lucide-react'
import { supabase, Database, ContentType } from '../../lib/supabase'
import FileUploader from '../UI/FileUploader'
import toast from 'react-hot-toast'

type CourseContent = Database['public']['Tables']['course_content']['Row']

interface ContentManagerProps {
  courseId: string
  onContentTypesChange: (types: ContentType[]) => void
}

const CONTENT_CONFIG: Record<ContentType, { label: string; icon: React.ReactNode; accept: string; maxSize: number }> = {
  ebook: {
    label: 'Ebook / PDF',
    icon: <FileText className="h-4 w-4" />,
    accept: 'application/pdf',
    maxSize: 50 * 1024 * 1024,
  },
  audio: {
    label: 'Audio',
    icon: <Music className="h-4 w-4" />,
    accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg',
    maxSize: 100 * 1024 * 1024,
  },
  video: {
    label: 'Video',
    icon: <Video className="h-4 w-4" />,
    accept: 'video/mp4,video/webm,video/ogg',
    maxSize: 500 * 1024 * 1024,
  },
}

const ContentManager: React.FC<ContentManagerProps> = ({ courseId, onContentTypesChange }) => {
  const [contents, setContents] = useState<CourseContent[]>([])
  const [loading, setLoading] = useState(true)
  const [addingType, setAddingType] = useState<ContentType | null>(null)

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
        title: `${CONTENT_CONFIG[type].label}`,
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
    setAddingType(null)
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Course Content</h3>
        {availableTypes.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddingType(addingType ? null : availableTypes[0])}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Content
            </button>
            {addingType !== null && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                {availableTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleAddContent(type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {CONTENT_CONFIG[type].icon}
                    {CONTENT_CONFIG[type].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {contents.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-500">No content added yet. Add ebook, audio, or video content.</p>
        </div>
      )}

      <div className="space-y-3">
        {contents.map(item => {
          const config = CONTENT_CONFIG[item.content_type as ContentType]
          return (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300" />
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    item.content_type === 'ebook' ? 'bg-blue-100 text-blue-700' :
                    item.content_type === 'audio' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
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
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleTitleChange(item.id, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {(item.content_type === 'audio' || item.content_type === 'video') && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.duration_seconds}
                      onChange={(e) => handleDurationChange(item.id, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
