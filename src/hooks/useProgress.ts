import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from './useAuth'

type UserProgress = Database['public']['Tables']['user_progress']['Row']

export function useProgress(courseId: string, contentId: string) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user || !contentId) {
      setLoading(false)
      return
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .maybeSingle()

      setProgress(data)
      setLoading(false)
    }

    fetch()
  }, [user, contentId])

  const saveProgress = useCallback(
    (seconds: number, percent: number) => {
      if (!user || !contentId || !courseId) return

      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = window.setTimeout(async () => {
        const completed = percent >= 95
        const now = new Date().toISOString()

        const { data } = await supabase
          .from('user_progress')
          .upsert(
            {
              user_id: user.id,
              course_id: courseId,
              content_id: contentId,
              progress_seconds: seconds,
              progress_percent: percent,
              completed,
              last_accessed_at: now,
            },
            { onConflict: 'user_id,content_id' }
          )
          .select()
          .maybeSingle()

        if (data) setProgress(data)
      }, 2000)
    },
    [user, contentId, courseId]
  )

  const markCompleted = useCallback(async () => {
    if (!user || !contentId || !courseId) return

    const now = new Date().toISOString()
    const { data } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          content_id: contentId,
          progress_percent: 100,
          completed: true,
          last_accessed_at: now,
        },
        { onConflict: 'user_id,content_id' }
      )
      .select()
      .maybeSingle()

    if (data) setProgress(data)
  }, [user, contentId, courseId])

  return {
    progress,
    loading,
    lastPosition: progress?.progress_seconds || 0,
    progressPercent: progress?.progress_percent || 0,
    isCompleted: progress?.completed || false,
    saveProgress,
    markCompleted,
  }
}

export function useCourseProgress(courseId: string) {
  const { user } = useAuth()
  const [progressList, setProgressList] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false)
      return
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)

      setProgressList(data || [])
      setLoading(false)
    }

    fetch()
  }, [user, courseId])

  const overallPercent =
    progressList.length > 0
      ? Math.round(progressList.reduce((sum, p) => sum + p.progress_percent, 0) / progressList.length)
      : 0

  const allCompleted = progressList.length > 0 && progressList.every((p) => p.completed)

  return {
    progressList,
    loading,
    overallPercent,
    allCompleted,
    getContentProgress: (contentId: string) => progressList.find((p) => p.content_id === contentId),
  }
}
