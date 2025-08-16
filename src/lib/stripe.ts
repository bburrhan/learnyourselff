import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Only load Stripe if we have a valid publishable key
export const stripePromise = stripePublishableKey && 
  stripePublishableKey !== 'pk_test_...' && 
  stripePublishableKey.startsWith('pk_') 
    ? loadStripe(stripePublishableKey) 
    : null

export const createCheckoutSession = async (courseId: string, email: string, fullName: string) => {
  // Check if Stripe is configured
  if (!stripePromise) {
    console.log('Stripe not configured, using demo mode')
    return {
      sessionId: 'demo_session_' + Math.random().toString(36).substr(2, 9),
      url: null,
      demo: true
    }
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      courseId,
      email,
      fullName,
      successUrl: `${window.location.origin}/dashboard?success=true`,
      cancelUrl: `${window.location.origin}/course/${courseId}`,
    }),
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create checkout session')
  }
  
  return result
}