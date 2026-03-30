import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { sessionId, language = "en" } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment processing is not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!stripeResponse.ok) {
      const stripeError = await stripeResponse.json();
      console.error("Stripe session fetch error:", stripeError);
      return new Response(
        JSON.stringify({ error: "Failed to verify payment session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await stripeResponse.json();

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", payment_status: session.payment_status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const courseId = session.metadata?.course_id;
    const email = session.customer_email || session.metadata?.email;
    const fullName = session.metadata?.full_name || "";
    const sessionLanguage = session.metadata?.language || language;

    if (!courseId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing course or email information in session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: existingPurchase } = await admin
      .from("purchases")
      .select("id")
      .eq("stripe_payment_id", session.payment_intent || sessionId)
      .maybeSingle();

    if (existingPurchase) {
      const { data: course } = await admin
        .from("courses")
        .select("id, title, price, currency")
        .eq("id", courseId)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          already_processed: true,
          purchase_id: existingPurchase.id,
          course_id: courseId,
          course_title: course?.title,
          email,
          full_name: fullName,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency?.toUpperCase() ?? "USD",
          is_new_user: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: course } = await admin
      .from("courses")
      .select("id, title, price, currency")
      .eq("id", courseId)
      .maybeSingle();

    if (!course) {
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userList } = await admin.auth.admin.listUsers();
    const matchedUser = userList?.users?.find((u) => u.email === email);
    const isNewUser = !matchedUser;
    let userId: string | null = matchedUser?.id ?? null;

    if (!userId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      userId = profile?.id ?? null;
    }

    const { data: purchase, error: purchaseError } = await admin
      .from("purchases")
      .insert({
        user_id: userId,
        course_id: courseId,
        email,
        stripe_payment_id: session.payment_intent || sessionId,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency?.toUpperCase() ?? "USD",
        status: "completed",
      })
      .select()
      .maybeSingle();

    if (purchaseError) {
      console.error("Failed to create purchase record:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to record purchase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isNewUser) {
      const appUrl = Deno.env.get("APP_URL") || "https://learnyourself.co";
      const resetRedirectUrl = `${appUrl}/${sessionLanguage}/auth/reset-password`;

      const { error: resetError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: resetRedirectUrl,
        },
      });

      if (resetError) {
        console.error("Failed to generate password reset link:", resetError);
      } else {
        console.log("Password reset link generated and sent for new user:", email);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        purchase_id: purchase!.id,
        course_id: courseId,
        course_title: course.title,
        email,
        full_name: fullName,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency?.toUpperCase() ?? "USD",
        is_new_user: isNewUser,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
