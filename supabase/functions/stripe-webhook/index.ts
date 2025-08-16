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
  console.log('Webhook received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log('Webhook body length:', body.length);
    console.log('Stripe signature present:', !!signature);
    console.log('Webhook secret configured:', !!endpointSecret);

    // If no webhook secret is configured, process the event anyway for testing
    let event: Stripe.Event;

    if (!endpointSecret) {
      console.log('No webhook secret - parsing event directly (TEST MODE)');
      try {
        event = JSON.parse(body);
      } catch (parseError) {
        console.error('Failed to parse webhook body:', parseError);
        return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
      }
    } else {
      if (!signature) {
        console.error('Missing signature with webhook secret configured');
        return new Response('Missing signature', { status: 400, headers: corsHeaders });
      }

      try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        console.log('Webhook signature verified successfully');
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response('Webhook signature verification failed', { status: 400, headers: corsHeaders });
      }
    }

    console.log('Processing webhook event:', event.type, 'ID:', event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Processing completed checkout session:', session.id);
      console.log('Session metadata:', session.metadata);
      console.log('Session amount:', session.amount_total);
      console.log('Session currency:', session.currency);
      console.log('Customer email:', session.customer_email);

      const { courseId, customerEmail, customerName } = session.metadata || {};
      const finalEmail = customerEmail || session.customer_email;

      if (!courseId || !finalEmail) {
        console.error('Missing required data:', { 
          courseId, 
          customerEmail, 
          sessionEmail: session.customer_email,
          finalEmail 
        });
        return new Response('Missing required metadata', { 
          status: 400, 
          headers: corsHeaders 
        });
      }

      console.log('Fetching course with ID:', courseId);

      // Fetch course details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        console.error('Course not found:', courseError);
        return new Response('Course not found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }

      console.log('Found course:', course.title, 'Price:', course.price);

      // Check if user exists
      let userId = null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', finalEmail)
        .single();

      if (profile) {
        userId = profile.id;
        console.log('Found existing user:', userId);
      } else {
        console.log('Guest purchase - no user ID');
      }

      console.log('Creating purchase record...');

      // Create purchase record
      const purchaseData = {
        user_id: userId,
        course_id: courseId,
        email: finalEmail,
        stripe_payment_id: session.payment_intent as string || session.id,
        amount: (session.amount_total || 0) / 100, // Convert from cents
        currency: session.currency || 'usd',
        status: 'completed' as const,
        download_count: 0,
      };

      console.log('Purchase data:', purchaseData);

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single();

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
        return new Response('Error creating purchase record', { 
          status: 500, 
          headers: corsHeaders 
        });
      }

      console.log('Purchase record created successfully:', purchase.id);

      // Send email with course materials
      try {
        console.log('Sending course email...');
        await sendCourseEmail({
          email: finalEmail,
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

      console.log('Webhook processing completed successfully');
    } else {
      console.log('Ignoring webhook event type:', event.type);
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
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  console.log('Resend API key configured:', !!resendApiKey);

  if (!resendApiKey) {
    console.log('No Resend API key - logging email content instead');
    console.log('Email would be sent to:', email);
    console.log('Subject: Your Course: ' + courseTitle);
    console.log('PDF URL:', pdfUrl);
    return;
  }

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Thank you for your purchase!</h1>
        
        <p>Hi ${name},</p>
        
        <p>Thank you for purchasing <strong>"${courseTitle}"</strong>!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Course Details</h2>
          <p><strong>Title:</strong> ${courseTitle}</p>
          <p><strong>Description:</strong> ${courseDescription}</p>
        </div>
        
        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1d4ed8;">📚 Download Your Course</h3>
          <p>Your course materials are ready for download:</p>
          <a href="${pdfUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Download PDF Course
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Purchase Reference: ${purchaseId}<br>
          If you have any questions, please contact our support team.
        </p>
        
        <p>Best regards,<br>LearnYourself Team</p>
      </div>
    `;

    console.log('Sending email via Resend...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LearnYourself <noreply@learnyourself.co>',
        to: [email],
        subject: `Your Course: ${courseTitle}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      throw new Error(`Resend API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Email sent successfully via Resend:', result.id);

  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    throw error;
  }
}