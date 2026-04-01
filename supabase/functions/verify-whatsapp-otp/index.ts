import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateDummyEmail(userId: string): string {
  return `${userId}@noemail.learnyourself.app`;
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
    const {
      phone_number,
      otp_code,
      purpose = "login",
      full_name,
      language = "en",
    } = await req.json();

    if (!phone_number || !otp_code) {
      return new Response(
        JSON.stringify({ error: "phone_number and otp_code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = normalizePhone(phone_number);

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioVerifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const twilioUrl = `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/VerificationCheck`;

    const body = new URLSearchParams({
      To: normalizedPhone,
      Code: otp_code.trim(),
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok || twilioData.status !== "approved") {
      console.error("Twilio verification failed:", twilioData);
      return new Response(
        JSON.stringify({ error: "Incorrect or expired verification code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. First look up by profiles.phone_number (fast, indexed)
    let existingUserId: string | null = null;
    let wasWhatsappVerified = false;

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, whatsapp_verified")
      .eq("phone_number", normalizedPhone)
      .maybeSingle();

    if (existingProfile) {
      existingUserId = existingProfile.id;
      wasWhatsappVerified = existingProfile.whatsapp_verified;
      console.log("Found user via profiles.phone_number:", existingUserId);
    } else {
      // 2. Fallback: search auth.users metadata (covers users whose profile was not backfilled)
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authUsers?.users) {
        const match = authUsers.users.find(
          (u) => u.user_metadata?.phone_number === normalizedPhone
        );
        if (match) {
          existingUserId = match.id;
          console.log("Found user via auth.users metadata fallback:", existingUserId);

          // Backfill the profile with phone_number so future lookups are fast
          await admin
            .from("profiles")
            .update({ phone_number: normalizedPhone, whatsapp_verified: true })
            .eq("id", existingUserId);
        }
      }
    }

    let userId: string;
    let isNewUser = false;
    let accessToken: string;
    let refreshToken: string;
    let expiresAt: number;

    if (existingUserId) {
      userId = existingUserId;

      const profileUpdate: Record<string, unknown> = { whatsapp_verified: true };
      if (full_name && full_name.trim()) {
        profileUpdate.full_name = full_name.trim();
      }

      await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (full_name && full_name.trim()) {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: full_name.trim() },
        });
      }

      const tempPassword = crypto.randomUUID() + "Aa1!";
      await admin.auth.admin.updateUserById(userId, { password: tempPassword });

      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
        email: generateDummyEmail(userId),
        password: tempPassword,
      });

      if (loginError || !loginData.session) {
        console.error("Login error after OTP verify:", loginError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = loginData.session.access_token;
      refreshToken = loginData.session.refresh_token;
      expiresAt = loginData.session.expires_at ?? 0;
    } else {
      isNewUser = true;
      const newUserId = crypto.randomUUID();
      const dummyEmail = generateDummyEmail(newUserId);
      const tempPassword = crypto.randomUUID() + "Aa1!";

      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: dummyEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name ?? "",
          phone_number: normalizedPhone,
          language_preference: language,
        },
      });

      if (createError || !newUser.user) {
        console.error("Create user error:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;

      // handle_new_user trigger fires automatically, but upsert ensures phone_number is set
      await admin.from("profiles").upsert({
        id: userId,
        email: dummyEmail,
        phone_number: normalizedPhone,
        full_name: full_name ?? null,
        language_preference: language,
        whatsapp_verified: true,
      });

      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
        email: dummyEmail,
        password: tempPassword,
      });

      if (loginError || !loginData.session) {
        console.error("Login error after signup:", loginError);
        return new Response(
          JSON.stringify({ error: "Account created but failed to sign in. Please try logging in." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = loginData.session.access_token;
      refreshToken = loginData.session.refresh_token;
      expiresAt = loginData.session.expires_at ?? 0;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, language_preference, phone_number")
      .eq("id", userId)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        is_new_user: isNewUser,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        user: {
          id: userId,
          phone_number: normalizedPhone,
          full_name: profile?.full_name ?? full_name ?? null,
          language_preference: profile?.language_preference ?? language,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-whatsapp-otp error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
