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

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const { data: authUser } = await admin.auth.admin.getUserById(profile?.id ?? "").catch(() => ({ data: { user: null } }));

    let userId: string | null = profile?.id ?? null;

    if (!userId) {
      const { data: userList } = await admin.auth.admin.listUsers();
      const matchedUser = userList?.users?.find((u) => u.email === email);
      userId = matchedUser?.id ?? null;
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

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const courseUrl = `${supabaseUrl.replace("https://", "https://").split(".supabase.co")[0]}.supabase.co`.replace(
      /^.*$/,
      `https://learnyourself.co/${sessionLanguage}/learn/${courseId}`
    );

    fetch(`${supabaseUrl}/functions/v1/send-course-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        purchaseId: purchase!.id,
        email,
        fullName,
        courseTitle: course.title,
        courseId,
        courseUrl: `https://learnyourself.co/${sessionLanguage}/learn/${courseId}`,
        isFree: false,
        language: sessionLanguage,
      }),
    }).catch((err) => {
      console.error("Failed to send course email:", err);
    });

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
