import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'
import { handleSupabaseError } from '../utils/errorHandler'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        logger.debug('Getting initial session')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          const errorResult = handleSupabaseError(error, 'getSession')
          
          // If session is expired or refresh token is invalid, clear the session
          if (errorResult.code === 'SESSION_EXPIRED') {
            logger.info('Session expired, clearing invalid session data')
            await supabase.auth.signOut()
            setUser(null)
          }
        } else {
          setUser(session?.user ?? null)
          logger.info('Session retrieved', { 
            hasUser: !!session?.user,
            userId: session?.user?.id 
          })
        }
      } catch (error) {
        logger.error('Failed to get session', { error }, error as Error)
        // Clear any potentially corrupted session data
        try {
          await supabase.auth.signOut()
          setUser(null)
        } catch (signOutError) {
          logger.error('Failed to clear session after error', { signOutError }, signOutError as Error)
        }
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed', { 
          event, 
          hasUser: !!session?.user,
          userId: session?.user?.id 
        })
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      logger.info('Sign in attempt', { email })
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        logger.warn('Sign in failed', { email, error: error.message })
        return { data, error: handleSupabaseError(error, 'signIn') }
      }
      
      logger.info('Sign in successful', { email, userId: data.user?.id })
      return { data, error }
    } catch (error) {
      logger.error('Sign in error', { email, error }, error as Error)
      return { data: null, error }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      logger.info('Sign up attempt', { email, hasFullName: !!fullName })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            language_preference: 'en',
          },
        },
      })
      
      if (error) {
        logger.warn('Sign up failed', { email, error: error.message })
        return { data, error: handleSupabaseError(error, 'signUp') }
      }
      
      logger.info('Sign up successful', { email, userId: data.user?.id })
      return { data, error }
    } catch (error) {
      logger.error('Sign up error', { email, error }, error as Error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      logger.info('Sign out attempt')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.warn('Sign out failed', { error: error.message })
        return { error: handleSupabaseError(error, 'signOut') }
      }
      
      logger.info('Sign out successful')
      return { error }
    } catch (error) {
      logger.error('Sign out error', { error }, error as Error)
      return { error }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}