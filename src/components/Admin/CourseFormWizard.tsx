import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database, ContentType } from '../../lib/supabase'
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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    currency: 'USD',
    category: '',
    instructor_name: '',
    instructor_bio: '',
    pdf_url: '',
    cover_image_url: '',
    tags: '',
    language: 'en',
    difficulty_level: 'beginner' as const,
    is_featured: false,
    is_active: true,
  })

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title,
        description: editingCourse.description,
        price: editingCourse.price,
        currency: editingCourse.currency,
        category: editingCourse.category,
        instructor_name: editingCourse.instructor_name,
        instructor_bio: editingCourse.instructor_bio,
        pdf_url: editingCourse.pdf_url || '',
        cover_image_url: editingCourse.cover_image_url || '',
        tags: editingCourse.tags?.join(', ') || '',
        language: editingCourse.language,
        difficulty_level: editingCourse.difficulty_level,
        is_featured: editingCourse.is_featured,
        is_active: editingCourse.is_active,
      })
      setSavedCourse(editingCourse)
    }
  }, [editingCourse])

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const courseData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('difficulty')}</label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('instructor')} Name</label>
                  <input
                    type="text"
                    required
                    value={formData.instructor_name}
                    onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
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
                    <option value="tl">Filipino</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('instructor')} Bio</label>
                <textarea
                  required
                  rows={2}
                  value={formData.instructor_bio}
                  onChange={(e) => setFormData({ ...formData, instructor_bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
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
                    className="w-32 h-24 object-cover rounded-lg border mt-2"
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
                    className="w-10 h-10 rounded-lg object-cover"
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
