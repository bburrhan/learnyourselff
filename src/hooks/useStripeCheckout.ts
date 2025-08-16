import { useState } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      toast.error('Please log in to make a purchase')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: priceId,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/products`,
          mode: mode
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create checkout session')
    } finally {
      setLoading(false)
    }
  }

  return {
    createCheckoutSession,
    loading
  }
}