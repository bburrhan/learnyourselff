import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import logger from '../utils/logger'
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler'

type Course = Database['public']['Tables']['courses']['Row']

export const useCourses = (filters?: {
  category?: string
  language?: string
  search?: string
  priceRange?: [number, number]
  formatType?: string
  fields?: string
}) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    const fetchCourses = async () => {
      const result = await handleAsyncError(async () => {
        setLoading(true)
        setError(null)
        
        logger.debug('Fetching courses', { 
          language: i18n.language, 
          filters 
        })

        logger.info('Fetching courses from Supabase', { language: i18n.language })
        
        let query = supabase
          .from('courses')
          .select(filters?.fields || '*')
          .eq('is_active', true)
          .eq('language', i18n.language)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category)
        }
        if (filters?.priceRange) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1])
        }
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }
        if (filters?.formatType && filters.formatType !== 'all') {
          query = query.contains('format_types', [filters.formatType])
        }

        const { data: supabaseCourses, error: supabaseError } = await query
        
        logger.debug('Supabase courses result', { 
          count: supabaseCourses?.length || 0, 
          error: supabaseError,
          courses: supabaseCourses?.map(c => ({ id: c.id, title: c.title }))
        })

        if (supabaseError) {
          handleSupabaseError(supabaseError, 'fetchCourses')
          throw supabaseError
        }

        logger.info('Using Supabase courses', { count: supabaseCourses?.length || 0 })
        setCourses(supabaseCourses || [])
        
        return true
      }, 'fetchCourses', false)
      
      if (!result) {
        logger.warn('Fetch courses failed')
        setCourses([])
        setError('Failed to fetch courses')
      }
      
      setLoading(false)
    }

    fetchCourses()
  }, [filters?.category, filters?.search, filters?.priceRange?.[0], filters?.priceRange?.[1], filters?.formatType, filters?.fields, i18n.language])

  return { courses, loading, error }
}

export const useFeaturedCourses = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      const result = await handleAsyncError(async () => {
        logger.debug('Fetching featured courses', { language: i18n.language })
        
        const { data: supabaseCourses, error: supabaseError } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .eq('language', i18n.language)
          .order('created_at', { ascending: false })
          .limit(6)

        if (supabaseError) {
          handleSupabaseError(supabaseError, 'fetchFeaturedCourses')
          throw supabaseError
        }

        logger.info('Using Supabase featured courses', { count: supabaseCourses?.length || 0 })
        setCourses(supabaseCourses || [])
        
        return true
      }, 'fetchFeaturedCourses', false)
      
      if (!result) {
        logger.warn('Fetch featured courses failed')
        setCourses([])
        setError('Failed to fetch featured courses')
      }
      
      setLoading(false)
    }

    fetchFeaturedCourses()
  }, [i18n.language])

  return { courses, loading, error }
}