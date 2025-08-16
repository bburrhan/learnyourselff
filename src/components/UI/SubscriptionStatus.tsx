import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { stripeProducts } from '../../stripe-config'
import { Crown, AlertCircle } from 'lucide-react'

interface SubscriptionData {
  status: string
  price_id: string | null
  current_period_end: number | null
  cancel_at_period_end: boolean
}

const SubscriptionStatus: React.FC = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error)
        }

        if (data) {
          setSubscription({
            status: data.subscription_status,
            price_id: data.price_id,
            current_period_end: data.current_period_end,
            cancel_at_period_end: data.cancel_at_period_end || false
          })
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  if (loading || !user || !subscription) {
    return null
  }

  const product = subscription.price_id ? stripeProducts.find(p => p.priceId === subscription.price_id) : null
  const isActive = subscription.status === 'active'

  if (!isActive) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-royal-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <Crown className="h-4 w-4" />
        <span className="text-sm font-medium">
          {product ? product.name : 'Active Plan'}
        </span>
        {subscription.cancel_at_period_end && (
          <AlertCircle className="h-4 w-4 text-yellow-300" />
        )}
      </div>
      {subscription.current_period_end && (
        <div className="text-xs opacity-90 mt-1">
          {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
          {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

export default SubscriptionStatus