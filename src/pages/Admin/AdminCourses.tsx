import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { handleSupabaseError, handleAsyncError } from '../../utils/errorHandler'
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileText,
  Music,
  Video,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CourseFormWizard from '../../components/Admin/CourseFormWizard'

type Course = Database['public']['Tables']['courses']['Row']
type Category = Database['public']['Tables']['categories']['Row']

const AdminCourses: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

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
        { id: 'tech', name: 'Technology', slug: 'technology' },
        { id: 'biz', name: 'Business', slug: 'business' },
        { id: 'design', name: 'Design', slug: 'design' },
        { id: 'marketing', name: 'Marketing', slug: 'marketing' },
        { id: 'wellness', name: 'Health & Wellness', slug: 'health-wellness' },
        { id: 'personal', name: 'Personal Development', slug: 'personal-development' },
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
      setError('Failed to fetch courses')
    }

    setLoading(false)
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('manageCourses')}</h1>
            <p className="text-gray-600 mt-2">{t('createManage')}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addCourse')}
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('course')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCourses.map((course) => {
                  const hasContent = course.content_types && course.content_types.length > 0

                  return (
                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={course.cover_image_url}
                            alt={course.title}
                            className="w-8 h-11 rounded object-cover mr-4 shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasContent ? (
                          <div className="flex items-center gap-1.5">
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
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            No content
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: course.currency,
                        }).format(course.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleCourseStatus(course.id, course.is_active)}
                            className="flex items-center"
                          >
                            {course.is_active ? (
                              <ToggleRight className="h-6 w-6 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-gray-400" />
                            )}
                          </button>
                          <span className={`text-sm ${course.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {course.is_active ? t('active') : t('inactive')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('noCourses')}</p>
            </div>
          )}
        </div>

        {showForm && (
          <CourseFormWizard
            editingCourse={editingCourse}
            categories={categories}
            onClose={handleCloseForm}
            onSaved={handleCourseSaved}
          />
        )}
      </div>
    </div>
  )
}

export default AdminCourses
