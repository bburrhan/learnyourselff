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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: otpRecord, error: otpFetchError } = await admin
      .from("whatsapp_otps")
      .select("*")
      .eq("phone_number", phone_number)
      .eq("purpose", purpose)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpFetchError) {
      console.error("OTP fetch error:", otpFetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: "OTP not found or expired. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (otpRecord.attempts >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many failed attempts. Please request a new code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (otpRecord.otp_code !== otp_code.trim()) {
      await admin
        .from("whatsapp_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      const remaining = 5 - (otpRecord.attempts + 1);
      return new Response(
        JSON.stringify({
          error: remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many failed attempts. Please request a new code.",
          attempts_remaining: remaining,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await admin
      .from("whatsapp_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, whatsapp_verified")
      .eq("phone_number", phone_number)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;
    let accessToken: string;
    let refreshToken: string;
    let expiresAt: number;

    if (existingProfile) {
      userId = existingProfile.id;

      if (!existingProfile.whatsapp_verified) {
        await admin
          .from("profiles")
          .update({ whatsapp_verified: true })
          .eq("id", userId);
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
      if (purpose === "login") {
        return new Response(
          JSON.stringify({ error: "No account found with this phone number. Please sign up first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
          phone_number,
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

      await admin.from("profiles").upsert({
        id: userId,
        phone_number,
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
          phone_number,
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
