import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database, ContentType, FORMAT_TYPES, FormatType } from '../../lib/supabase'
import { handleSupabaseError, handleAsyncError } from '../../utils/errorHandler'
import logger from '../../utils/logger'
import toast from 'react-hot-toast'
import {
  X,
  Save,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText,
  Music,
  Video,
  Info,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Minus,
} from 'lucide-react'
import FileUploader from '../UI/FileUploader'
import ContentManager from './ContentManager'

type Course = Database['public']['Tables']['courses']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface CourseFormWizardProps {
  editingCourse: Course | null
  categories: Category[]
  onClose: () => void
  onSaved: (course: Course, isNew: boolean) => void
}

const STEPS = [
  { id: 'details', label: 'Course Details' },
  { id: 'content', label: 'Course Content' },
]

const CourseFormWizard: React.FC<CourseFormWizardProps> = ({
  editingCourse,
  categories,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [savedCourse, setSavedCourse] = useState<Course | null>(editingCourse)

  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    price: 0,
    currency: 'USD',
    category: '',
    pdf_url: '',
    cover_image_url: '',
    tags: '',
    language: 'en',
    is_featured: false,
    is_active: true,
    format_types: [] as FormatType[],
  })

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title,
        slug: editingCourse.slug || generateSlug(editingCourse.title),
        short_description: editingCourse.short_description || '',
        description: editingCourse.description,
        price: editingCourse.price,
        currency: editingCourse.currency,
        category: editingCourse.category,
        pdf_url: editingCourse.pdf_url || '',
        cover_image_url: editingCourse.cover_image_url || '',
        tags: editingCourse.tags?.join(', ') || '',
        language: editingCourse.language,
        is_featured: editingCourse.is_featured,
        is_active: editingCourse.is_active,
        format_types: (editingCourse.format_types as FormatType[]) || [],
      })
      setSavedCourse(editingCourse)
    }
  }, [editingCourse])

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const courseData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      format_types: formData.format_types,
      updated_at: new Date().toISOString(),
    }

    const result = await handleAsyncError(async () => {
      if (savedCourse) {
        const { error } = await supabase
          .from('courses')
          .update({ ...courseData, updated_at: new Date().toISOString() })
          .eq('id', savedCourse.id)

        if (error) {
          handleSupabaseError(error, 'updateCourse')
          throw error
        }

        const updated = { ...savedCourse, ...courseData } as Course
        setSavedCourse(updated)
        onSaved(updated, false)
        toast.success('Course details saved!')
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert([courseData])
          .select()

        if (error) {
          handleSupabaseError(error, 'createCourse')
          throw error
        }

        if (data && data[0]) {
          logger.info('Course created', { courseId: data[0].id })
          setSavedCourse(data[0])
          onSaved(data[0], true)
          toast.success('Course created! Now add your content files.')
        }
      }
      return true
    }, 'submitCourseForm')

    if (!result) {
      toast.error('Failed to save course')
    } else {
      setCurrentStep(1)
    }

    setSubmitting(false)
  }

  const toggleFormatType = (value: FormatType) => {
    setFormData(prev => ({
      ...prev,
      format_types: prev.format_types.includes(value)
        ? prev.format_types.filter(f => f !== value)
        : [...prev.format_types, value],
    }))
  }

  const insertMarkdown = (before: string, after: string = '') => {
    const ta = descriptionRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = formData.description.slice(start, end)
    const replacement = before + (selected || 'text') + after
    const newVal =
      formData.description.slice(0, start) + replacement + formData.description.slice(end)
    setFormData(prev => ({ ...prev, description: newVal }))
    setTimeout(() => {
      ta.focus()
      const cursor = start + before.length + (selected || 'text').length + after.length
      ta.setSelectionRange(cursor, cursor)
    }, 0)
  }

  const insertLinePrefix = (prefix: string) => {
    const ta = descriptionRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = formData.description.lastIndexOf('\n', start - 1) + 1
    const newVal =
      formData.description.slice(0, lineStart) +
      prefix +
      formData.description.slice(lineStart)
    setFormData(prev => ({ ...prev, description: newVal }))
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const contentTypeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    ebook: { icon: <FileText className="h-4 w-4" />, color: 'text-blue-500' },
    audio: { icon: <Music className="h-4 w-4" />, color: 'text-emerald-500' },
    video: { icon: <Video className="h-4 w-4" />, color: 'text-orange-500' },
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              {editingCourse ? `${t('edit')} ${t('course')}` : `${t('add')} ${t('course')}`}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep
              const isCompleted = idx < currentStep
              const isDisabled = idx === 1 && !savedCourse

              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <div className={`flex-1 h-0.5 rounded ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  )}
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setCurrentStep(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                        : isCompleted
                        ? 'bg-green-50 text-green-700'
                        : isDisabled
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                    )}
                    {step.label}
                  </button>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 0 && (
            <form id="course-details-form" onSubmit={handleSubmitDetails} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('course')} Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setFormData(prev => ({
                        ...prev,
                        title,
                        slug: !editingCourse || !editingCourse.slug ? generateSlug(title) : prev.slug,
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('category')}
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No categories available. Please create categories first.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL Slug
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (SEO-friendly URL — e.g. my-course-title)
                  </span>
                </label>
                <div className="flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow overflow-hidden">
                  <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-300 whitespace-nowrap">
                    /course/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'),
                      }))
                    }
                    placeholder="my-course-title"
                    className="flex-1 px-3 py-2 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Short Description
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (shown in card / course header — 1-2 sentences)
                  </span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="A concise hook that appears on course cards and at the top of the detail page."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Description
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (supports **bold**, *italic*, ## headings, - lists)
                  </span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow">
                  <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => insertMarkdown('**', '**')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => insertMarkdown('*', '*')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      title="Heading"
                      onClick={() => insertLinePrefix('## ')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      title="Bullet list"
                      onClick={() => insertLinePrefix('- ')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Numbered list"
                      onClick={() => insertLinePrefix('1. ')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      title="Horizontal rule"
                      onClick={() => insertMarkdown('\n---\n')}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    ref={descriptionRef}
                    required
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Write the full course description here. Use the toolbar above for formatting."
                    className="w-full px-3 py-2 font-mono text-sm focus:outline-none resize-y"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('price')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('language')}</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  <option value="en">English</option>
                  <option value="tr">Turkish</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image</label>
                <FileUploader
                  bucket="course-covers"
                  path="covers"
                  accept="image/jpeg,image/png,image/webp"
                  maxSize={10 * 1024 * 1024}
                  currentFileUrl={formData.cover_image_url}
                  label=""
                  onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                />
                <p className="mt-1 text-xs text-gray-500">Or enter a URL directly:</p>
                <input
                  type="text"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://images.pexels.com/..."
                />
                {formData.cover_image_url && (
                  <img
                    src={formData.cover_image_url}
                    alt="Preview"
                    className="w-24 h-32 object-cover rounded-lg border mt-2 shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('tags')} (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="react, javascript, web development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_TYPES.map((fmt) => {
                    const selected = formData.format_types.includes(fmt.value)
                    return (
                      <button
                        key={fmt.value}
                        type="button"
                        onClick={() => toggleFormatType(fmt.value)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                          selected
                            ? `${fmt.bg} ${fmt.color} ${fmt.border} ring-2 ring-offset-1 ring-current`
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('featured')} {t('course')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('active')}</span>
                </label>
              </div>

              {!savedCourse && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Upload content after saving</p>
                    <p className="mt-0.5 text-blue-600">
                      After you save the course details, you can upload multiple
                      PDFs, audio tracks, and video lectures in the next step.
                    </p>
                  </div>
                </div>
              )}
            </form>
          )}

          {currentStep === 1 && savedCourse && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                {formData.cover_image_url && (
                  <img
                    src={formData.cover_image_url}
                    alt=""
                    className="w-8 h-11 rounded object-cover shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{formData.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{formData.category}</span>
                    {savedCourse.content_types?.map((ct: string) => {
                      const cfg = contentTypeIcons[ct]
                      return cfg ? (
                        <span key={ct} className={cfg.color}>{cfg.icon}</span>
                      ) : null
                    })}
                  </div>
                </div>
              </div>

              <ContentManager
                courseId={savedCourse.id}
                onContentTypesChange={async (types: ContentType[]) => {
                  await supabase
                    .from('courses')
                    .update({ content_types: types })
                    .eq('id', savedCourse.id)
                  setSavedCourse(prev => prev ? { ...prev, content_types: types } : prev)
                }}
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50 rounded-b-xl">
          <div>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Details
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {currentStep === 1 ? 'Done' : t('cancel')}
            </button>
            {currentStep === 0 && (
              <button
                type="submit"
                form="course-details-form"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  t('saving')
                ) : savedCourse ? (
                  <>
                    <Save className="h-4 w-4" />
                    Save & Continue
                  </>
                ) : (
                  <>
                    Save & Add Content
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseFormWizard
