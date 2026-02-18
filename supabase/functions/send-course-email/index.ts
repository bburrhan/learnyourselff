import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface EmailRequest {
  purchaseId: string;
  email: string;
  fullName: string;
  courseTitle: string;
  courseId: string;
  courseUrl: string;
  isFree?: boolean;
  language?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      purchaseId,
      email,
      fullName,
      courseTitle,
      courseId,
      courseUrl,
      isFree = false,
      language = 'en'
    }: EmailRequest = await req.json();

    if (!purchaseId || !email || !courseTitle || !courseUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailContent = language === 'tr' ? {
      subject: `${isFree ? 'Ucretsiz Kurs' : 'Kurs Satin Alimi'} - ${courseTitle}`,
      greeting: `Merhaba ${fullName || 'Degerli Ogrenci'},`,
      thankYou: isFree
        ? `${courseTitle} adli ucretsiz kursa kaydoldugunuz icin tesekkur ederiz!`
        : `${courseTitle} adli kursu satin aldiginiz icin tesekkur ederiz!`,
      accessInfo: 'Kurs materyallerinize asagidaki baglantidan erisebilirsiniz:',
      accessButton: 'Kursa Eris',
      supportInfo: 'Herhangi bir sorunuz varsa, support@learnyourself.co adresinden bize ulasabilirsiniz.',
      regards: 'Saygilarimizla,<br>LearnYourself Ekibi'
    } : {
      subject: `${isFree ? 'Free Course' : 'Course Purchase'} - ${courseTitle}`,
      greeting: `Hello ${fullName || 'Valued Student'},`,
      thankYou: isFree
        ? `Thank you for enrolling in the free course: ${courseTitle}!`
        : `Thank you for purchasing: ${courseTitle}!`,
      accessInfo: 'You can access your course materials using the link below:',
      accessButton: 'Access Course',
      supportInfo: 'If you have any questions, please contact us at support@learnyourself.co',
      regards: 'Best regards,<br>The LearnYourself Team'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailContent.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #10B981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; font-size: 16px; }
          .course-info { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LearnYourself</div>
            <h1>${emailContent.subject}</h1>
          </div>

          <div class="content">
            <p>${emailContent.greeting}</p>

            <p>${emailContent.thankYou}</p>

            <div class="course-info">
              <h3>${courseTitle}</h3>
              <p><strong>${language === 'tr' ? 'Satin Alma ID' : 'Purchase ID'}:</strong> ${purchaseId}</p>
              ${isFree ? `<p><strong>${language === 'tr' ? 'Kurs Turu' : 'Course Type'}:</strong> ${language === 'tr' ? 'Ucretsiz' : 'Free'}</p>` : ''}
            </div>

            <p>${emailContent.accessInfo}</p>

            <div style="text-align: center;">
              <a href="${courseUrl}" class="button">${emailContent.accessButton}</a>
            </div>

            <p><small>${emailContent.supportInfo}</small></p>
          </div>

          <div class="footer">
            <p>${emailContent.regards}</p>
            <p><small>&copy; 2025 LearnYourself.co - ${language === 'tr' ? 'Tum haklari saklidir' : 'All rights reserved'}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPayload = {
      from: 'LearnYourself <noreply@learnyourself.co>',
      to: [email],
      subject: emailContent.subject,
      html: htmlContent,
    };

    console.log('Sending email via Resend API to:', email);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendResult);
      throw new Error(`Resend API error: ${resendResult.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully via Resend:', resendResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Course email sent successfully',
        purchaseId,
        emailId: resendResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending course email:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to send course email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
