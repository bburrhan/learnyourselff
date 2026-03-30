import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database, FORMAT_TYPES } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { handleSupabaseError, handleAsyncError } from '../../utils/errorHandler'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileText,
  Music,
  Video,
  AlertTriangle,
  ChevronDown,
  X,
  BookOpen,
  Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CourseFormWizard from '../../components/Admin/CourseFormWizard'
import CourseDetailModal from '../../components/Admin/CourseDetailModal'

type Course = Database['public']['Tables']['courses']['Row']
type Category = Database['public']['Tables']['categories']['Row']

const AdminCourses: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)

  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterContent, setFilterContent] = useState<string>('all')
  const [filterPrice, setFilterPrice] = useState<'all' | 'free' | 'paid'>('all')
  const [filterFormat, setFilterFormat] = useState<string>('all')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    fetchCourses()
    fetchCategories()
  }, [i18n.language])

  const fetchCategories = async () => {
    const result = await handleAsyncError(async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        handleSupabaseError(error, 'fetchCategoriesAdmin')
        throw error
      }

      setCategories(data || [])
      return true
    }, 'fetchCategoriesAdmin', false)

    if (!result) {
      const defaultCategories = [
        { id: 'biz-ent', name: 'Business & Entrepreneurship', slug: 'business-entrepreneurship' },
        { id: 'mkt-cnt', name: 'Marketing & Content', slug: 'marketing-content' },
        { id: 'sales', name: 'Sales & Conversion', slug: 'sales-conversion' },
        { id: 'prod', name: 'Productivity', slug: 'productivity' },
        { id: 'ai-tech', name: 'AI & Technology', slug: 'ai-technology' },
        { id: 'personal', name: 'Personal Development', slug: 'personal-development' },
        { id: 'wellness', name: 'Wellness & Health', slug: 'wellness-health' },
        { id: 'finance', name: 'Finance', slug: 'finance' },
      ]
      setCategories(defaultCategories as Category[])
    }
  }

  const fetchCourses = async () => {
    const result = await handleAsyncError(async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('language', i18n.language)
        .order('created_at', { ascending: false })

      if (error) {
        handleSupabaseError(error, 'fetchCoursesAdmin')
        throw error
      }

      setCourses(data || [])
      return true
    }, 'fetchCoursesAdmin', false)

    if (!result) {
      setCourses([])
    }

    setLoading(false)
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      filterCategory === 'all' || course.category === filterCategory

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && course.is_active) ||
      (filterStatus === 'inactive' && !course.is_active)

    const matchesContent =
      filterContent === 'all' ||
      (course.content_types && course.content_types.includes(filterContent))

    const matchesPrice =
      filterPrice === 'all' ||
      (filterPrice === 'free' && course.price === 0) ||
      (filterPrice === 'paid' && course.price > 0)

    const matchesFormat =
      filterFormat === 'all' ||
      (course.format_types && course.format_types.includes(filterFormat))

    return matchesSearch && matchesCategory && matchesStatus && matchesContent && matchesPrice && matchesFormat
  })

  const activeFilterCount = [
    filterCategory !== 'all',
    filterStatus !== 'all',
    filterContent !== 'all',
    filterPrice !== 'all',
    filterFormat !== 'all',
  ].filter(Boolean).length

  const clearFilters = () => {
    setFilterCategory('all')
    setFilterStatus('all')
    setFilterContent('all')
    setFilterPrice('all')
    setFilterFormat('all')
    setSearchTerm('')
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCourse(null)
  }

  const handleCourseSaved = (course: Course, isNew: boolean) => {
    if (isNew) {
      setCourses(prev => [course, ...prev])
    } else {
      setCourses(prev => prev.map(c => c.id === course.id ? course : c))
    }
  }

  const toggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    const result = await handleAsyncError(async () => {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId)

      if (error) {
        handleSupabaseError(error, 'toggleCourseStatus')
        throw error
      }

      setCourses(courses.map(course =>
        course.id === courseId
          ? { ...course, is_active: !currentStatus }
          : course
      ))

      toast.success(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
      return true
    }, 'toggleCourseStatus')

    if (!result) {
      toast.error('Failed to update course status')
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    const result = await handleAsyncError(async () => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) {
        handleSupabaseError(error, 'deleteCourse')
        throw error
      }

      setCourses(courses.filter(course => course.id !== courseId))
      toast.success('Course deleted successfully!')
      return true
    }, 'deleteCourse')

    if (!result) {
      toast.error('Failed to delete course')
    }
  }

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  const activeCount = courses.filter(c => c.is_active).length
  const freeCount = courses.filter(c => c.price === 0).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('manageCourses')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('createManage')}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {t('addCourse')}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{courses.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Inactive</p>
            <p className="text-2xl font-bold text-gray-400 mt-1">{courses.length - activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Free</p>
            <p className="text-2xl font-bold text-royal-blue-600 mt-1">{freeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(c => ({ value: c.slug || c.name, label: c.name })),
                ]}
              />
              <FilterSelect
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as typeof filterStatus)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
              <FilterSelect
                value={filterContent}
                onChange={setFilterContent}
                options={[
                  { value: 'all', label: 'All Content' },
                  { value: 'ebook', label: 'PDF / Ebook' },
                  { value: 'audio', label: 'Audio' },
                  { value: 'video', label: 'Video' },
                ]}
              />
              <FilterSelect
                value={filterPrice}
                onChange={(v) => setFilterPrice(v as typeof filterPrice)}
                options={[
                  { value: 'all', label: 'All Prices' },
                  { value: 'free', label: 'Free' },
                  { value: 'paid', label: 'Paid' },
                ]}
              />
              <FilterSelect
                value={filterFormat}
                onChange={setFilterFormat}
                options={[
                  { value: 'all', label: 'All Formats' },
                  ...FORMAT_TYPES.map(f => ({ value: f.value, label: f.label })),
                ]}
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
          {filteredCourses.length !== courses.length && (
            <p className="text-xs text-gray-400 mt-2.5">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {t('course')}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {t('category')}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course) => {
                  const hasContent = course.content_types && course.content_types.length > 0

                  return (
                    <tr key={course.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {course.cover_image_url ? (
                            <img
                              src={course.cover_image_url}
                              alt={course.title}
                              className="w-8 h-11 rounded-md object-cover shadow-sm flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-8 h-11 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{course.title}</p>
                            {course.slug && (
                              <p className="text-xs text-gray-400 truncate max-w-[220px] mt-0.5">/{course.slug}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full whitespace-nowrap">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {hasContent ? (
                          <div className="flex items-center gap-1">
                            {course.content_types.includes('ebook') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                <FileText className="h-3 w-3" />
                                PDF
                              </span>
                            )}
                            {course.content_types.includes('audio') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <Music className="h-3 w-3" />
                                Audio
                              </span>
                            )}
                            {course.content_types.includes('video') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                <Video className="h-3 w-3" />
                                Video
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {course.format_types && course.format_types.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {course.format_types.map((ft) => {
                              const cfg = FORMAT_TYPES.find(f => f.value === ft)
                              if (!cfg) return null
                              return (
                                <span
                                  key={ft}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                                >
                                  {cfg.label}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${course.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {course.price === 0
                            ? 'Free'
                            : new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: course.currency,
                              }).format(course.price)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => toggleCourseStatus(course.id, course.is_active)}
                          className="inline-flex items-center gap-1.5 group/toggle"
                        >
                          {course.is_active ? (
                            <ToggleRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-300" />
                          )}
                          <span className={`text-xs font-medium ${course.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {course.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingCourse(course)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(course)}
                            className="p-1.5 text-gray-400 hover:text-royal-blue-600 hover:bg-royal-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                {activeFilterCount > 0 || searchTerm
                  ? 'No courses match your filters'
                  : t('noCourses')}
              </p>
              {(activeFilterCount > 0 || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs text-royal-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <CourseFormWizard
          editingCourse={editingCourse}
          categories={categories}
          onClose={handleCloseForm}
          onSaved={handleCourseSaved}
        />
      )}

      {viewingCourse && (
        <CourseDetailModal
          course={viewingCourse}
          onClose={() => setViewingCourse(null)}
        />
      )}
    </div>
  )
}

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

const FilterSelect: React.FC<FilterSelectProps> = ({ value, onChange, options }) => {
  const selected = options.find(o => o.value === value)
  const isActive = value !== 'all'

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 text-xs font-medium border rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-royal-blue-500 ${
          isActive
            ? 'bg-royal-blue-50 border-royal-blue-300 text-royal-blue-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${isActive ? 'text-royal-blue-500' : 'text-gray-400'}`} />
    </div>
  )
}

export default AdminCourses
