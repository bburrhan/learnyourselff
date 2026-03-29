import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create client if we have valid environment variables
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  throw new Error('Supabase configuration is missing. Please set up your Supabase project by clicking "Connect to Supabase" in the top right corner.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ContentType = 'ebook' | 'audio' | 'video'

export type FormatType =
  | 'book'
  | 'listicle'
  | 'checklist'
  | 'notion-template'
  | 'email-course'
  | 'guide'
  | 'podcast'
  | 'prompt-pack'
  | 'toolstack'
  | 'workbook'

export interface FormatTypeConfig {
  value: FormatType
  label: string
  color: string
  bg: string
  border: string
}

export const FORMAT_TYPES: FormatTypeConfig[] = [
  { value: 'book', label: 'Book', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'listicle', label: 'Listicle', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  { value: 'checklist', label: 'Checklist', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'notion-template', label: 'Notion Template', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
  { value: 'email-course', label: 'E-mail Course', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'guide', label: 'Guide', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  { value: 'podcast', label: 'Podcast', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  { value: 'prompt-pack', label: 'Prompt Pack', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'toolstack', label: 'Toolstack', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { value: 'workbook', label: 'Workbook', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
]

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title: string
          slug: string | null
          short_description: string
          description: string
          price: number
          currency: string
          category: string
          pdf_url: string | null
          cover_image_url: string
          tags: string[]
          language: string
          content_types: ContentType[]
          format_types: FormatType[]
          created_at: string
          updated_at: string
          is_featured: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          slug?: string | null
          short_description?: string
          description: string
          price: number
          currency?: string
          category: string
          pdf_url?: string | null
          cover_image_url: string
          tags?: string[]
          language?: string
          content_types?: ContentType[]
          format_types?: FormatType[]
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          slug?: string | null
          short_description?: string
          description?: string
          price?: number
          currency?: string
          category?: string
          pdf_url?: string | null
          cover_image_url?: string
          tags?: string[]
          language?: string
          content_types?: ContentType[]
          format_types?: FormatType[]
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
        }
      }
      course_content: {
        Row: {
          id: string
          course_id: string
          content_type: ContentType
          file_url: string
          file_name: string
          file_size: number
          duration_seconds: number
          title: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          content_type: ContentType
          file_url?: string
          file_name?: string
          file_size?: number
          duration_seconds?: number
          title?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          content_type?: ContentType
          file_url?: string
          file_name?: string
          file_size?: number
          duration_seconds?: number
          title?: string
          sort_order?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          content_id: string
          progress_seconds: number
          progress_percent: number
          completed: boolean
          last_accessed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          content_id: string
          progress_seconds?: number
          progress_percent?: number
          completed?: boolean
          last_accessed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          content_id?: string
          progress_seconds?: number
          progress_percent?: number
          completed?: boolean
          last_accessed_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string | null
          course_id: string
          email: string
          stripe_payment_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at: string
          download_count: number
          last_download_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          course_id: string
          email: string
          stripe_payment_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          download_count?: number
          last_download_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          course_id?: string
          email?: string
          stripe_payment_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          download_count?: number
          last_download_at?: string | null
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          content: string
          excerpt: string
          slug: string
          author_name: string
          cover_image_url: string
          tags: string[]
          language: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          excerpt: string
          slug: string
          author_name: string
          cover_image_url: string
          tags?: string[]
          language?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          excerpt?: string
          slug?: string
          author_name?: string
          cover_image_url?: string
          tags?: string[]
          language?: string
          is_published?: boolean
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          language_preference: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          language_preference?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          language_preference?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          icon: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
    }
  }
}