import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) return "+" + cleaned.slice(1);
  if (!phone.startsWith("+")) return "+" + cleaned;
  return "+" + cleaned;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phone_number, purpose = "login", language = "en" } = await req.json();

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: "phone_number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validPurposes = ["login", "signup", "checkout"];
    if (!validPurposes.includes(purpose)) {
      return new Response(
        JSON.stringify({ error: "Invalid purpose" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = normalizePhone(phone_number);
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Use E.164 format (e.g. +1234567890)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await admin
      .from("whatsapp_otps")
      .select("id", { count: "exact", head: true })
      .eq("phone_number", normalizedPhone)
      .gte("created_at", oneMinuteAgo);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait before requesting another." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await admin.from("whatsapp_otps").insert({
      phone_number: normalizedPhone,
      otp_code: otpCode,
      purpose,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const whatsappApiUrl = Deno.env.get("WHATSAPP_API_URL");
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    const otpMessages: Record<string, string> = {
      en: `Your LearnYourself verification code is: *${otpCode}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      tr: `LearnYourself doğrulama kodunuz: *${otpCode}*\n\nBu kod 10 dakika içinde geçerliliğini yitirecektir. Kimseyle paylaşmayın.`,
      hi: `आपका LearnYourself सत्यापन कोड है: *${otpCode}*\n\nयह कोड 10 मिनट में समाप्त हो जाएगा।`,
      id: `Kode verifikasi LearnYourself Anda: *${otpCode}*\n\nKode ini berlaku selama 10 menit.`,
      bn: `আপনার LearnYourself যাচাইকরণ কোড: *${otpCode}*\n\nএই কোডটি 10 মিনিটে মেয়াদ শেষ হবে।`,
      vi: `Mã xác minh LearnYourself của bạn: *${otpCode}*\n\nMã này hết hạn sau 10 phút.`,
      ur: `آپ کا LearnYourself تصدیقی کوڈ: *${otpCode}*\n\nیہ کوڈ 10 منٹ میں ختم ہو جائے گا۔`,
    };

    const message = otpMessages[language] || otpMessages["en"];

    if (whatsappApiUrl && whatsappToken && whatsappPhoneId) {
      try {
        const waResponse = await fetch(
          `${whatsappApiUrl}/${whatsappPhoneId}/messages`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${whatsappToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: normalizedPhone,
              type: "text",
              text: { body: message },
            }),
          }
        );

        if (!waResponse.ok) {
          const errBody = await waResponse.text();
          console.error("WhatsApp API error:", errBody);
          return new Response(
            JSON.stringify({ error: "Failed to send WhatsApp message" }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (waErr) {
        console.error("WhatsApp send error:", waErr);
        return new Response(
          JSON.stringify({ error: "Failed to send WhatsApp message" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log(`[DEV] OTP for ${normalizedPhone}: ${otpCode}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        phone_number: normalizedPhone,
        expires_in: 600,
        message: "OTP sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-whatsapp-otp error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
