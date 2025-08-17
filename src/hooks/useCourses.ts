import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import logger from '../utils/logger'
import { handleSupabaseError, handleAsyncError } from '../utils/errorHandler'

type Course = Database['public']['Tables']['courses']['Row']
type Category = Database['public']['Tables']['categories']['Row']

const mockCourses: Course[] = [
  {
    id: 'mock-1',
    title: 'Complete Guide to Personal Finance',
    description: 'Learn how to manage your money, create budgets, and build wealth with this comprehensive guide.',
    price: 9.99,
    currency: 'USD',
    category: 'business',
    instructor_name: 'Sarah Johnson',
    instructor_bio: 'Financial advisor with 10+ years of experience',
    pdf_url: 'https://example.com/finance-guide.pdf',
    cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['stress', 'mindfulness', 'wellness'],
    language: 'en',
    difficulty_level: 'beginner' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_active: true,
  },
  {
    id: 'mock-3',
    title: 'Digital Marketing Basics',
    description: 'Master the fundamentals of digital marketing and grow your online presence.',
    price: 14.99,
    currency: 'USD',
    category: 'marketing',
    instructor_name: 'Elena Rodriguez',
    instructor_bio: 'Digital marketing specialist with 8 years of experience',
    pdf_url: 'https://example.com/digital-marketing.pdf',
    cover_image_url: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['marketing', 'social media', 'advertising'],
    language: 'en',
    difficulty_level: 'intermediate' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_active: true,
  },
  {
    id: 'mock-4',
    title: 'Web Development Fundamentals',
    description: 'Learn the basics of HTML, CSS, and JavaScript to build your first website.',
    price: 12.99,
    currency: 'USD',
    category: 'technology',
    instructor_name: 'Alex Thompson',
    instructor_bio: 'Full-stack developer with 12 years of experience',
    pdf_url: 'https://example.com/web-dev.pdf',
    cover_image_url: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['web', 'html', 'css', 'javascript'],
    language: 'en',
    difficulty_level: 'beginner' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_active: true,
  },
  {
    id: 'mock-5',
    title: 'Photography for Beginners',
    description: 'Master the art of photography with practical tips and techniques.',
    price: 8.99,
    currency: 'USD',
    category: 'design',
    instructor_name: 'Maria Garcia',
    instructor_bio: 'Professional photographer and visual artist',
    pdf_url: 'https://example.com/photography.pdf',
    cover_image_url: 'https://images.pexels.com/photos/606541/pexels-photo-606541.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['photography', 'camera', 'composition'],
    language: 'en',
    difficulty_level: 'beginner' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_active: true,
  },
  {
    id: 'mock-6',
    title: 'Time Management Mastery',
    description: 'Learn proven strategies to manage your time effectively and boost productivity.',
    price: 6.99,
    currency: 'USD',
    category: 'business',
    instructor_name: 'David Kim',
    instructor_bio: 'Productivity coach and business consultant',
    pdf_url: 'https://example.com/time-management.pdf',
    cover_image_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['productivity', 'time', 'efficiency'],
    language: 'en',
    difficulty_level: 'intermediate' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_active: true,
  },
  // Turkish courses
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
    cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['stres', 'mindfulness', 'sağlık'],
    language: 'tr',
    difficulty_level: 'beginner' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_active: true,
  },
  {
    id: 'mock-tr-3',
    title: 'Dijital Pazarlama Temelleri',
    description: 'Dijital pazarlamanın temellerini öğrenin ve online varlığınızı büyütün.',
    price: 14.99,
    currency: 'USD',
    category: 'marketing',
    instructor_name: 'Elif Yılmaz',
    instructor_bio: '8 yıl deneyimli dijital pazarlama uzmanı',
    pdf_url: 'https://example.com/dijital-pazarlama.pdf',
    cover_image_url: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['pazarlama', 'sosyal medya', 'reklam'],
    language: 'tr',
    difficulty_level: 'intermediate' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_active: true,
  },
  {
    id: 'mock-tr-4',
    title: 'Web Geliştirme Temelleri',
    description: 'HTML, CSS ve JavaScript temellerini öğrenerek ilk web sitenizi oluşturun.',
    price: 12.99,
    currency: 'USD',
    category: 'technology',
    instructor_name: 'Can Arslan',
    instructor_bio: '12 yıl deneyimli full-stack geliştirici',
    pdf_url: 'https://example.com/web-gelistirme.pdf',
    cover_image_url: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['web', 'html', 'css', 'javascript'],
    language: 'tr',
    difficulty_level: 'beginner' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_active: true,
  },
  {
    id: 'mock-tr-5',
    title: 'Fotoğrafçılık Başlangıcı',
    description: 'Pratik ipuçları ve tekniklerle fotoğrafçılık sanatında ustalaşın.',
    price: 8.99,
    currency: 'USD',
    category: 'design',
    instructor_name: 'Zeynep Kaya',
    instructor_bio: 'Profesyonel fotoğrafçı ve görsel sanatçı',
    pdf_url: 'https://example.com/fotografcilik.pdf',
    cover_image_url: 'https://images.pexels.com/photos/606541/pexels-photo-606541.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['fotoğrafçılık', 'kamera', 'kompozisyon'],
    language: 'tr',
    difficulty_level: 'beginner' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_active: true,
  },
  {
    id: 'mock-tr-6',
    title: 'Zaman Yönetimi Ustalığı',
    description: 'Zamanınızı etkili bir şekilde yönetmek ve verimliliği artırmak için kanıtlanmış stratejiler.',
    price: 6.99,
    currency: 'USD',
    category: 'business',
    instructor_name: 'Murat Şen',
    instructor_bio: 'Verimlilik koçu ve iş danışmanı',
    pdf_url: 'https://example.com/zaman-yonetimi.pdf',
    cover_image_url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['verimlilik', 'zaman', 'etkililik'],
    language: 'tr',
    difficulty_level: 'intermediate' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_active: true,
  },
]

const filterMockCourses = (courses: Course[], filters?: {
  category?: string
  language?: string
  difficulty?: string
  search?: string
  priceRange?: [number, number]
}) => {
  let filtered = [...courses]
  
  if (filters?.language) {
    filtered = filtered.filter(course => course.language === filters.language)
  }
  
  if (filters?.category && filters.category !== 'all') {
    filtered = filtered.filter(course => course.category === filters.category)
  }
  
  if (filters?.difficulty && filters.difficulty !== 'all') {
    filtered = filtered.filter(course => course.difficulty_level === filters.difficulty)
  }
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(course => 
      course.title.toLowerCase().includes(searchLower) ||
      course.description.toLowerCase().includes(searchLower) ||
      course.instructor_name.toLowerCase().includes(searchLower) ||
      course.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }
  
  if (filters?.priceRange) {
    filtered = filtered.filter(
      course => course.price >= filters.priceRange![0] && course.price <= filters.priceRange![1]
    )
  }
  
  return filtered
}

export const useCourses = (filters?: {
  category?: string
  language?: string
  difficulty?: string
  search?: string
  priceRange?: [number, number]
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

        // Always try to fetch from Supabase first
        logger.info('Fetching courses from Supabase', { language: i18n.language })
        
        let query = supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .eq('language', i18n.language)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category)
        }
        if (filters?.difficulty && filters.difficulty !== 'all') {
          query = query.eq('difficulty_level', filters.difficulty)
        }
        if (filters?.priceRange) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1])
        }
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,instructor_name.ilike.%${filters.search}%`)
        }
        
        const { data: supabaseCourses, error: supabaseError } = await query
        
        logger.debug('Supabase courses result', { 
          count: supabaseCourses?.length || 0, 
          error: supabaseError,
          courses: supabaseCourses?.map(c => ({ id: c.id, title: c.title }))
        })

        if (supabaseError) {
          handleSupabaseError(supabaseError, 'fetchCourses')
          // Don't throw error, fall back to mock data
          logger.warn('Falling back to mock data due to Supabase error')
        }

        if (!supabaseError && supabaseCourses && supabaseCourses.length > 0) {
          // Use real courses from Supabase
          logger.info('Using Supabase courses', { count: supabaseCourses.length })
          setCourses(supabaseCourses)
        } else {
          // Fallback to mock courses if no real courses found
          logger.info('Using mock courses as fallback')
          const filtersWithLanguage = {
            ...filters,
            language: i18n.language
          }
          setCourses(filterMockCourses(mockCourses, filtersWithLanguage))
        }
        
        return true
      }, 'fetchCourses', false)
      
      if (!result) {
        logger.warn('Fetch courses failed, using mock data')
        const filtersWithLanguage = {
          ...filters,
          language: i18n.language
        }
        setCourses(filterMockCourses(mockCourses, filtersWithLanguage))
      }
      
      setLoading(false)
    }

    fetchCourses()
  }, [filters?.category, filters?.difficulty, filters?.search, filters?.priceRange?.[0], filters?.priceRange?.[1], i18n.language])

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
        
        // Try to fetch featured courses from Supabase first
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
          throw new Error('Supabase error')
        }

        if (supabaseCourses && supabaseCourses.length > 0) {
          logger.info('Using Supabase featured courses', { count: supabaseCourses.length })
          setCourses(supabaseCourses)
        } else {
          // Fallback to mock courses
          logger.info('Using mock featured courses')
          setCourses(mockCourses.filter(course => course.is_featured && course.language === i18n.language))
        }
        
        return true
      }, 'fetchFeaturedCourses', false)
      
      if (!result) {
        logger.warn('Fetch featured courses failed, using mock data')
        // Fallback to mock courses on error
        setCourses(mockCourses.filter(course => course.is_featured && course.language === i18n.language))
      }
      
      setLoading(false)
    }

    fetchFeaturedCourses()
  }, [i18n.language])

  return { courses, loading, error }
}