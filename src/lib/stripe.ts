import logger from '../utils/logger'
import { handleNetworkError } from '../utils/errorHandler'
import { getCurrentLanguageFromUrl } from '../components/Layout/LanguageRouter'

// Client-side Stripe utilities
export const createCheckoutSession = async (courseId: string, email: string, fullName: string, language?: string) => {
  try {
    logger.info('Creating checkout session', { courseId, email })
    
    const currentLang = language || getCurrentLanguageFromUrl()
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        courseId,
        email,
        fullName,
        successUrl: `${window.location.origin}/${currentLang}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/${currentLang}/courses/${courseId}?canceled=true`,
      }),
    });

    if (!response.ok) {
      logger.warn('Checkout session creation failed', { 
        status: response.status, 
        statusText: response.statusText 
      })
      const errorData = await response.json();
      const error = new Error(errorData.error || 'Failed to create checkout session');
      handleNetworkError({ status: response.status }, 'createCheckoutSession')
      throw error;
    }

    const data = await response.json();
    logger.info('Checkout session created successfully', { sessionId: data.sessionId })
    return data;
  } catch (error) {
    logger.error('Checkout session error', { courseId, email, error }, error as Error);
    throw error;
  }
};