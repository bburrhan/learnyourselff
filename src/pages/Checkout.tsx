import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'
import Stripe from 'npm:stripe@17.7.0'

const corsOptions = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: {
    name: 'LearnYourself',
    version: '1.0.0',
  },
})

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsOptions })
  }

  try {
    const { courseId, email, fullName, successUrl, cancelUrl } = await req.json()

    if (!courseId || !email || !fullName || !successUrl || !cancelUrl) {
      throw new Error('Missing required parameters')
    }

    // Fetch course details from Supabase
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      console.error('Course fetch error:', courseError)
      throw new Error('Course not found or inactive')
    }

    console.log('Found course:', course.title, 'Price:', course.price)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: course.currency.toLowerCase(),
            product_data: {
              name: course.title,
              description: course.description,
              images: course.cover_image_url ? [course.cover_image_url] : [],
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        courseId: course.id,
        email: email,
        fullName: fullName,
      },
    })
    
    return new Response(
      JSON.stringify({
        sessionId: session.id,
      console.log('Redirecting to Stripe checkout with session:', session.sessionId)

        url: session.url,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsOptions,
        },
      }
      if (!stripe) {
        console.error('Stripe failed to load')
        throw new Error('Stripe not loaded')
      }
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session'
      }),
      {
        console.error('Stripe redirect error:', result.error)
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsOptions,
        },
      }
    )
  }
})