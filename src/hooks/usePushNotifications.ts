import { useEffect, useRef } from 'react'
import { PushNotifications } from '@capacitor/push-notifications'
import { isNative, getPlatform } from '../utils/platform'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import logger from '../utils/logger'

export const usePushNotifications = () => {
  const { user } = useAuth()
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!isNative() || !user || registeredRef.current) return

    const register = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions()

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions()
        }

        if (permStatus.receive !== 'granted') {
          logger.info('Push notification permission denied')
          return
        }

        await PushNotifications.register()
        registeredRef.current = true

        await PushNotifications.addListener('registration', async (token) => {
          logger.info('Push token received', { token: token.value })
          const { error } = await supabase.from('push_tokens').upsert(
            {
              user_id: user.id,
              token: token.value,
              platform: getPlatform(),
              device_id: token.value.slice(0, 32),
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,device_id' }
          )
          if (error) {
            logger.error('Failed to save push token', { error })
          }
        })

        await PushNotifications.addListener('registrationError', (err) => {
          logger.error('Push registration failed', { error: err.error })
        })

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          logger.info('Push notification received', { title: notification.title })
        })

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const data = action.notification.data
          if (data?.url) {
            window.location.hash = data.url
          }
          logger.info('Push notification action', { actionId: action.actionId })
        })
      } catch (err) {
        logger.error('Push notification setup failed', { err }, err as Error)
      }
    }

    register()

    return () => {
      PushNotifications.removeAllListeners()
    }
  }, [user])
}
