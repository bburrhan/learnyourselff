// Client-side Stripe utilities
export const createCheckoutSession = async (courseId: string, email: string, fullName: string) => {
  try {
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
        successUrl: `${window.location.origin}/dashboard/my-courses?success=true`,
        cancelUrl: `${window.location.origin}/courses/${courseId}?canceled=true`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Checkout session error:', error);
    throw error;
  }
};