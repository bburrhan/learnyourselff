import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'
import { isNative } from '../utils/platform'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  throw new Error('Supabase configuration is missing. Please set up your Supabase project by clicking "Connect to Supabase" in the top right corner.')
}

const capacitorStorage = {
  async getItem(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key })
    return value
  },
  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value })
  },
  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key })
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(isNative() ? { storage: capacitorStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !isNative(),
  },
})

export type ContentType = 'ebook' | 'audio' | 'video'

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
          pdf_url: string | null
          cover_image_url: string
          tags: string[]
          language: string
          content_types: ContentType[]
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
          pdf_url?: string | null
          cover_image_url: string
          tags?: string[]
          language?: string
          content_types?: ContentType[]
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
          pdf_url?: string | null
          cover_image_url?: string
          tags?: string[]
          language?: string
          content_types?: ContentType[]
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
      push_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          platform: string
          device_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          platform: string
          device_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          platform?: string
          device_id?: string
          is_active?: boolean
          updated_at?: string
        }
      }
    }
  }
}