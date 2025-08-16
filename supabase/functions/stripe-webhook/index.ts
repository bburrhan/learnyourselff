import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import Stripe from "npm:stripe@17.7.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !endpointSecret) {
      console.error('Missing signature or webhook secret');
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Processing completed checkout session:', session.id);
      console.log('Session metadata:', session.metadata);

      const { courseId, customerEmail, customerName } = session.metadata || {};

      if (!courseId || !customerEmail) {
        console.error('Missing required metadata:', { courseId, customerEmail });
        return new Response('Missing required metadata', { status: 400 });
      }

      // Fetch course details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        console.error('Course not found:', courseError);
        return new Response('Course not found', { status: 404 });
      }

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          course_id: courseId,
          email: customerEmail,
          stripe_payment_id: session.payment_intent as string,
          amount: (session.amount_total || 0) / 100, // Convert from cents
          currency: session.currency || 'usd',
          status: 'completed',
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
        return new Response('Error creating purchase record', { status: 500 });
      }

      console.log('Purchase record created:', purchase.id);

      // Send email with course materials
      try {
        await sendCourseEmail({
          email: customerEmail,
          name: customerName || 'Customer',
          courseTitle: course.title,
          courseDescription: course.description,
          pdfUrl: course.pdf_url,
          purchaseId: purchase.id,
        });
        console.log('Course email sent successfully');
      } catch (emailError) {
        console.error('Error sending course email:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    return new Response('Webhook processed successfully', { 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook processing failed', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

async function sendCourseEmail({
  email,
  name,
  courseTitle,
  courseDescription,
  pdfUrl,
  purchaseId,
}: {
  email: string;
  name: string;
  courseTitle: string;
  courseDescription: string;
  pdfUrl: string;
  purchaseId: string;
}) {
  // For now, just log the email details
  // In production, you would integrate with an email service like SendGrid, Resend, etc.
  console.log('Sending course email:', {
    to: email,
    subject: `Your Course: ${courseTitle}`,
    courseTitle,
    courseDescription,
    pdfUrl,
    purchaseId,
  });

  // Example email content that would be sent:
  const emailContent = `
    Hi ${name},

    Thank you for purchasing "${courseTitle}"!

    Course Description: ${courseDescription}

    Your course materials are ready for download:
    Download Link: ${pdfUrl}

    Purchase Reference: ${purchaseId}

    If you have any questions, please contact our support team.

    Best regards,
    LearnYourself Team
  `;

  console.log('Email content:', emailContent);

  // TODO: Integrate with actual email service
  // Example with Resend:
  // const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  // await resend.emails.send({
  //   from: 'noreply@learnyourself.co',
  //   to: email,
  //   subject: `Your Course: ${courseTitle}`,
  //   html: emailContent,
  // });
}