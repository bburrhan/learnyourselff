import { createClient } from 'npm:@supabase/supabase-js@2'

interface PasswordResetRequest {
  email: string;
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
    const { email, language = 'en' }: PasswordResetRequest = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (userError || !userData.user) {
      console.log('User not found for password reset:', email);
      // For security, we still return success even if user doesn't exist
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If an account with this email exists, a password reset link has been sent.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate password reset token
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://learnyourself.co'}/${language}/reset-password`
      }
    });

    if (resetError || !resetData.properties?.action_link) {
      console.error('Failed to generate reset link:', resetError);
      throw new Error('Failed to generate password reset link');
    }

    const resetLink = resetData.properties.action_link;

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      throw new Error('Email service not configured');
    }

    // Create email content based on language
    const emailContent = language === 'tr' ? {
      subject: 'Şifre Sıfırlama - LearnYourself',
      greeting: 'Merhaba,',
      message: 'LearnYourself hesabınız için şifre sıfırlama talebinde bulundunuz.',
      instruction: 'Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:',
      buttonText: 'Şifremi Sıfırla',
      expiry: 'Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.',
      noRequest: 'Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.',
      regards: 'Saygılarımızla,<br>LearnYourself Ekibi'
    } : {
      subject: 'Password Reset - LearnYourself',
      greeting: 'Hello,',
      message: 'You have requested a password reset for your LearnYourself account.',
      instruction: 'Click the link below to reset your password:',
      buttonText: 'Reset My Password',
      expiry: 'This link will expire in 1 hour.',
      noRequest: 'If you did not request this, you can safely ignore this email.',
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #DC2626; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .security-note { background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #6B7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 LearnYourself</div>
            <h1>${emailContent.subject}</h1>
          </div>
          
          <div class="content">
            <p>${emailContent.greeting}</p>
            
            <p>${emailContent.message}</p>
            
            <p>${emailContent.instruction}</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">${emailContent.buttonText}</a>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ ${language === 'tr' ? 'Güvenlik Uyarısı' : 'Security Notice'}:</strong></p>
              <p>${emailContent.expiry}</p>
              <p>${emailContent.noRequest}</p>
            </div>
            
            <div class="security-note">
              <p><strong>${language === 'tr' ? 'Güvenlik İpucu' : 'Security Tip'}:</strong> ${language === 'tr' ? 'Bu e-postayı beklemiyorsanız, hesabınızın güvenliği için şifrenizi değiştirmeyi düşünün.' : 'If you weren\'t expecting this email, consider changing your password for account security.'}</p>
            </div>
          </div>
          
          <div class="footer">
            <p>${emailContent.regards}</p>
            <p><small>© 2025 LearnYourself.co - ${language === 'tr' ? 'Tüm hakları saklıdır' : 'All rights reserved'}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API
    const emailPayload = {
      from: 'LearnYourself Security <security@learnyourself.co>',
      to: [email],
      subject: emailContent.subject,
      html: htmlContent,
    };

    console.log('Sending password reset email via Resend API to:', email);
    
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

    console.log('Password reset email sent successfully via Resend:', resendResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully',
        emailId: resendResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send password reset email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});