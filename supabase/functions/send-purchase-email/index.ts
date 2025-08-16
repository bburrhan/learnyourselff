import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'
import { Resend } from 'npm:resend@4.0.0'

const corsOptions = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsOptions })
  }

  try {
    const { purchaseId, email, courseTitle, coursePdfUrl, customerName } = await req.json()

    if (!purchaseId || !email || !courseTitle || !coursePdfUrl) {
      throw new Error('Missing required parameters')
    }

    // Generate secure download link (in production, this would be a signed URL)
    const downloadLink = `${Deno.env.get('SUPABASE_URL')}/functions/v1/secure-download?purchase=${purchaseId}&token=${btoa(purchaseId + Date.now())}`

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Course is Ready!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .course-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .download-btn { display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .download-btn:hover { background: #1d4ed8; }
            .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }
            .highlight { color: #3b82f6; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">LearnYourself</div>
              <h1>Your Course is Ready! 🎉</h1>
              <p>Thank you for your purchase. Your learning journey starts now!</p>
            </div>
            
            <div class="content">
              <p>Hi ${customerName || 'there'},</p>
              
              <p>Congratulations! Your purchase has been confirmed and your course is ready for download.</p>
              
              <div class="course-card">
                <h2 style="margin-top: 0; color: #1f2937;">${courseTitle}</h2>
                <p style="margin-bottom: 0;">You now have <span class="highlight">lifetime access</span> to this course.</p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${downloadLink}" class="download-btn">
                  📥 Download Your Course PDF
                </a>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #92400e;">📧 Save This Email</h3>
                <p style="margin-bottom: 0; color: #92400e;">Keep this email safe! You can use the download link anytime to access your course.</p>
              </div>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Download your PDF course materials</li>
                <li>Start learning at your own pace</li>
                <li>Apply what you learn immediately</li>
                <li>Join our community for support</li>
              </ul>
              
              <p>Need help? Simply reply to this email or contact us at <a href="mailto:support@learnyourself.co">support@learnyourself.co</a></p>
              
              <p>Happy learning!<br>
              <strong>The LearnYourself Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 LearnYourself. All rights reserved.</p>
              <p>123 Education Street, Learning District, Knowledge City, KC 12345</p>
              <p>You received this email because you purchased a course from LearnYourself.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'LearnYourself <noreply@learnyourself.co>',
      to: [email],
      subject: `Your Course "${courseTitle}" is Ready for Download! 📚`,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({
        success: true,
        emailId: data?.id,
        message: 'Purchase confirmation email sent successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsOptions,
        },
      }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send purchase confirmation email'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsOptions,
        },
      }
    )
  }
})