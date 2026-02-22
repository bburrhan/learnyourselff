import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'
import { handleSupabaseError } from '../utils/errorHandler'
import { nativeApp } from '../lib/nativeBridge'
import { isNative } from '../utils/platform'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        logger.debug('Getting initial session')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          const errorResult = handleSupabaseError(error, 'getSession')

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state changed', {
          event,
          hasUser: !!session?.user,
          userId: session?.user?.id
        })
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    let removeUrlListener = () => {}
    if (isNative()) {
      removeUrlListener = nativeApp.onUrlOpen((url) => {
        logger.info('Deep link received', { url })
        const parsed = new URL(url)
        const params = new URLSearchParams(parsed.hash.replace('#', '?'))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken && refreshToken) {
          ;(async () => {
            try {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
              logger.info('Session set from deep link')
            } catch (err) {
              logger.error('Failed to set session from deep link', { err }, err as Error)
            }
          })()
        }
      })
    }

    return () => {
      subscription.unsubscribe()
      removeUrlListener()
    }
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
        // If there's no session, treat it as success (already signed out)
        if (error.message?.includes('Auth session missing')) {
          logger.info('Sign out skipped - no active session')
          setUser(null)
          return { error: null }
        }

        logger.warn('Sign out failed', { error: error.message })
        return { error: handleSupabaseError(error, 'signOut', false) }
      }

      logger.info('Sign out successful')
      return { error: null }
    } catch (error) {
      logger.error('Sign out error', { error }, error as Error)
      setUser(null) // Clear user state even if signOut fails
      return { error: null }
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