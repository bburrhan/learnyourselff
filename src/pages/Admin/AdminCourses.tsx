import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Upload,
  Save,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

type Course = Database['public']['Tables']['courses']['Row']

const AdminCourses: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
    fetchCourses()
  }, [i18n.language])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('language', i18n.language)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      // Provide mock courses for admin
      const mockCoursesEn = [
        {
          id: 'mock-1',
          title: 'Complete Guide to Personal Finance',
          description: 'Learn how to manage your money, create budgets, and build wealth.',
          price: 9.99,
          currency: 'USD',
          category: 'business',
          instructor_name: 'Sarah Johnson',
          instructor_bio: 'Financial advisor with 10+ years of experience',
          pdf_url: 'https://example.com/finance-guide.pdf',
          cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
          tags: ['finance', 'budgeting', 'wealth'],
          language: 'en',
          difficulty_level: 'beginner' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_featured: true,
          is_active: true,
        },
        {
          id: 'mock-2',
          title: 'Stress Management in 30 Minutes',
          description: 'Quick and effective techniques to reduce stress and improve your mental well-being.',
          price: 4.99,
          currency: 'USD',
          category: 'wellness',
          instructor_name: 'Dr. Michael Chen',
          instructor_bio: 'Licensed therapist and mindfulness expert',
          pdf_url: 'https://example.com/stress-management.pdf',
          cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
          tags: ['stress', 'mindfulness', 'wellness'],
          language: 'en',
          difficulty_level: 'beginner' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_featured: true,
          is_active: true,
        }
      ]
      
      const mockCoursesTr = [
        {
          id: 'mock-tr-1',
          title: 'Kişisel Finans Rehberi',
          description: 'Paranızı nasıl yöneteceğinizi, bütçe oluşturacağınızı ve zenginlik inşa edeceğinizi öğrenin.',
          price: 9.99,
          currency: 'USD',
          category: 'business',
          instructor_name: 'Ayşe Demir',
          instructor_bio: '10+ yıl deneyimli finansal danışman',
          pdf_url: 'https://example.com/finans-rehberi.pdf',
          cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
          tags: ['finans', 'bütçe', 'zenginlik'],
          language: 'tr',
          difficulty_level: 'beginner' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_featured: true,
          is_active: true,
        },
        {
          id: 'mock-tr-2',
          title: '30 Dakikada Stres Yönetimi',
          description: 'Stresi azaltmak ve zihinsel sağlığınızı iyileştirmek için hızlı ve etkili teknikler.',
          price: 4.99,
          currency: 'USD',
          category: 'wellness',
          instructor_name: 'Dr. Mehmet Özkan',
          instructor_bio: 'Lisanslı terapist ve mindfulness uzmanı',
          pdf_url: 'https://example.com/stres-yonetimi.pdf',
          cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
          tags: ['stres', 'mindfulness', 'sağlık'],
          language: 'tr',
          difficulty_level: 'beginner' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_featured: true,
          is_active: true,
        }
      ]
      
      const mockCourses = i18n.language === 'tr' ? mockCoursesTr : mockCoursesEn
      setCourses(mockCourses)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
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
      difficulty_level: 'beginner',
      is_featured: false,
      is_active: true,
    })
    setEditingCourse(null)
    setShowForm(false)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      currency: course.currency,
      category: course.category,
      instructor_name: course.instructor_name,
      instructor_bio: course.instructor_bio,
      pdf_url: course.pdf_url,
      cover_image_url: course.cover_image_url || '',
      tags: course.tags?.join(', ') || '',
      language: course.language,
      difficulty_level: course.difficulty_level,
      is_featured: course.is_featured,
      is_active: course.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const courseData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        updated_at: new Date().toISOString(),
      }

      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id)

        if (error) throw error
        toast.success('Course updated successfully!')
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([courseData])

        if (error) throw error
        toast.success('Course created successfully!')
      }

      await fetchCourses()
      resetForm()
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCourseStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.map(course =>
        course.id === courseId
          ? { ...course, is_active: !currentStatus }
          : course
      ))

      toast.success(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error('Error toggling course status:', error)
      toast.error('Failed to update course status')
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.filter(course => course.id !== courseId))
      toast.success('Course deleted successfully!')
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    }
  }

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('manageCourses')}</h1>
            <p className="text-gray-600 mt-2">{t('createManage')}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addCourse')}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('course')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={course.cover_image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'}
                          alt={course.title}
                          className="w-10 h-10 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            by {course.instructor_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {course.category}
                      </span>
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
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('noCourses')}</p>
            </div>
          )}
        </div>

        {/* Course Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingCourse ? t('edit') + ' ' + t('course') : t('add') + ' ' + t('course')}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('course')} Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('category')}
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select {t('category')}</option>
                      <option value="technology">Technology</option>
                      <option value="business">Business</option>
                      <option value="design">Design</option>
                      <option value="marketing">Marketing</option>
                      <option value="language">Language</option>
                      <option value="science">Science</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('price')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('difficulty')}
                    </label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('instructor')} Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.instructor_name}
                      onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('language')}
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="tr">Turkish</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('instructor')} Bio
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.instructor_bio}
                    onChange={(e) => setFormData({ ...formData, instructor_bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF URL (Required)
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.pdf_url}
                    onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/course.pdf"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tags')} (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      t('saving')
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingCourse ? t('update') + ' ' + t('course') : t('create') + ' ' + t('course')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCourses