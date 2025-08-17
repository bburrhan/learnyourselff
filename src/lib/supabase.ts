import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create client if we have valid environment variables
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  throw new Error('Supabase configuration is missing. Please set up your Supabase project by clicking "Connect to Supabase" in the top right corner.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          currency: string
          category: string
          instructor_name: string
          instructor_bio: string
          pdf_url: string
          cover_image_url: string
          tags: string[]
          language: string
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          created_at: string
          updated_at: string
          is_featured: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          currency?: string
          category: string
          instructor_name: string
          instructor_bio: string
          pdf_url: string
          cover_image_url: string
          tags?: string[]
          language?: string
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          currency?: string
          category?: string
          instructor_name?: string
          instructor_bio?: string
          pdf_url?: string
          cover_image_url?: string
          tags?: string[]
          language?: string
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
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