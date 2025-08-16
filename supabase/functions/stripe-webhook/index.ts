import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'
import Stripe from 'npm:stripe@17.7.0'

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
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature found', { status: 400 })
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`)
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid' && session.mode === 'payment') {
          // Extract metadata
          const courseId = session.metadata?.courseId
          const email = session.metadata?.email || session.customer_email
          const fullName = session.metadata?.fullName

          if (!courseId || !email) {
            console.error('Missing required metadata in checkout session')
            break
          }

          // Get user ID if they're authenticated
          let userId = null
          try {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', email)
              .single()
            
            if (profiles) {
              userId = profiles.id
            }
          } catch (error) {
            console.log('User not found in profiles, proceeding as guest purchase')
          }

          // Create purchase record
          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert([
              {
                user_id: userId,
                course_id: courseId,
                email: email,
                stripe_payment_id: session.payment_intent as string,
                amount: (session.amount_total || 0) / 100, // Convert from cents
                currency: session.currency || 'USD',
                status: 'completed',
              }
            ])

          if (purchaseError) {
            console.error('Error creating purchase record:', purchaseError)
          } else {
            console.log('Purchase record created successfully for session:', session.id)
            
            // Send purchase confirmation email
            try {
              const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-purchase-email`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  purchaseId: purchaseError ? null : 'generated-purchase-id', // In real implementation, get the actual purchase ID
                  email: email,
                  courseTitle: course.title,
                  coursePdfUrl: course.pdf_url,
                  customerName: fullName,
                }),
              })
              
              const emailResult = await emailResponse.json()
              if (emailResult.error) {
                console.error('Failed to send purchase email:', emailResult.error)
              } else {
                console.log('Purchase confirmation email sent successfully')
              }
            } catch (emailError) {
              console.error('Error sending purchase email:', emailError)
            }
          }
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})