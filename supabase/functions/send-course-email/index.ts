interface EmailRequest {
  purchaseId: string;
  email: string;
  fullName: string;
  courseTitle: string;
  courseId: string;
  pdfUrl: string;
  isFree?: boolean;
  language?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
      pdfUrl,
      isFree = false,
      language = 'en'
    }: EmailRequest = await req.json();

    // Validate required fields
    if (!purchaseId || !email || !courseTitle || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create email content based on language
    const emailContent = language === 'tr' ? {
      subject: `${isFree ? 'Ücretsiz Kurs' : 'Kurs Satın Alımı'} - ${courseTitle}`,
      greeting: `Merhaba ${fullName || 'Değerli Öğrenci'},`,
      thankYou: isFree 
        ? `${courseTitle} adlı ücretsiz kursa kaydolduğunuz için teşekkür ederiz!`
        : `${courseTitle} adlı kursu satın aldığınız için teşekkür ederiz!`,
      accessInfo: 'Kurs materyallerinize aşağıdaki bağlantıdan erişebilirsiniz:',
      downloadButton: 'Kursu İndir',
      supportInfo: 'Herhangi bir sorunuz varsa, support@learnyourself.co adresinden bize ulaşabilirsiniz.',
      regards: 'Saygılarımızla,<br>LearnYourself Ekibi'
    } : {
      subject: `${isFree ? 'Free Course' : 'Course Purchase'} - ${courseTitle}`,
      greeting: `Hello ${fullName || 'Valued Student'},`,
      thankYou: isFree 
        ? `Thank you for enrolling in the free course: ${courseTitle}!`
        : `Thank you for purchasing: ${courseTitle}!`,
      accessInfo: 'You can access your course materials using the link below:',
      downloadButton: 'Download Course',
      supportInfo: 'If you have any questions, please contact us at support@learnyourself.co',
      regards: 'Best regards,<br>The LearnYourself Team'
    };

    // Create HTML email template
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
          .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
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
              <p><strong>${language === 'tr' ? 'Satın Alma ID' : 'Purchase ID'}:</strong> ${purchaseId}</p>
              ${isFree ? `<p><strong>${language === 'tr' ? 'Kurs Türü' : 'Course Type'}:</strong> ${language === 'tr' ? 'Ücretsiz' : 'Free'}</p>` : ''}
            </div>
            
            <p>${emailContent.accessInfo}</p>
            
            <div style="text-align: center;">
              <a href="${pdfUrl}" class="button">${emailContent.downloadButton}</a>
            </div>
            
            <p><small>${emailContent.supportInfo}</small></p>
          </div>
          
          <div class="footer">
            <p>${emailContent.regards}</p>
            <p><small>© 2025 LearnYourself.co - ${language === 'tr' ? 'Tüm hakları saklıdır' : 'All rights reserved'}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // In a real implementation, you would send the email using a service like:
    // - Supabase Edge Functions with Resend
    // - SendGrid
    // - Mailgun
    // - AWS SES
    
    // For demo purposes, we'll simulate sending the email
    console.log('Email would be sent to:', email);
    console.log('Email content:', htmlContent);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Course email sent successfully',
        purchaseId 
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