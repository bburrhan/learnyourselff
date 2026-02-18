import React, { useState, useMemo } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, X, AlertCircle } from 'lucide-react'
import { useCourses } from '../hooks/useCourses'
import { supabase } from '../lib/supabase'
import CourseCard from '../components/UI/CourseCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Courses: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [showFilters, setShowFilters] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])

  // Build filters object
  const filters = useMemo(() => ({
    search: searchTerm || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
    priceRange: priceRange,
  }), [searchTerm, selectedCategory, selectedLanguage, priceRange])

  const { courses, loading, error } = useCourses(filters)

  // Fetch categories
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (error) throw error
        setCategories(data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Update URL params when filters change
  const updateSearchParams = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (selectedLanguage !== 'all') params.set('language', selectedLanguage)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedLanguage('all')
    setPriceRange([0, 500])
    setSearchParams({})
  }

  const languages = ['all', 'en', 'tr', 'es', 'fr']

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedLanguage !== 'all'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('Courses')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('exploreCollection')}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateSearchParams()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-5 w-5 mr-2" />
              {t('filters')}
            </button>
          </div>

          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block mt-6 pt-6 border-t border-gray-100`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filterByCategory')}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filterByLanguage')}
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">{t('allLanguages')}</option>
                  {languages.slice(1).map((language) => (
                    <option key={language} value={language}>
                      {language.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('filterByPrice')}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-royal-blue-600"
                  />
                  <div className="text-sm text-gray-600 font-medium">
                    $0 - ${priceRange[1]}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={updateSearchParams}
                className="px-6 py-3 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
              >
                {t('applyFilters')}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('clearFilters')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <p className="text-gray-600 font-medium">
            {loading ? t('loading') : `${courses.length} ${t('coursesFound')}`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16 bg-red-50 rounded-xl border border-red-200">
            <div className="text-red-400 mb-4">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-red-600 text-lg font-semibold">{t('error')}: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Course Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-12">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('noCourses')}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t('adjustCriteria')}
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-royal-blue-600 text-white rounded-lg hover:bg-royal-blue-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
            >
              {t('clearAllFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses