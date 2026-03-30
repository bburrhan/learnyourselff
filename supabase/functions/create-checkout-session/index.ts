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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment processing is not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { courseId, email, fullName, successUrl, cancelUrl, language = "en" } = await req.json();

    if (!courseId || !email) {
      return new Response(
        JSON.stringify({ error: "courseId and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, title, description, price, currency, cover_image_url")
      .eq("id", courseId)
      .eq("is_active", true)
      .maybeSingle();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (course.price === 0) {
      return new Response(
        JSON.stringify({ error: "This course is free, use the free enrollment endpoint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const priceInCents = Math.round(course.price * 100);
    const currency = (course.currency || "usd").toLowerCase();

    const finalSuccessUrl = successUrl || `${supabaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${supabaseUrl}/courses/${courseId}?canceled=true`;

    const params = new URLSearchParams();
    params.set("payment_method_types[0]", "card");
    params.set("mode", "payment");
    params.set("customer_email", email);
    params.set("line_items[0][price_data][currency]", currency);
    params.set("line_items[0][price_data][unit_amount]", String(priceInCents));
    params.set("line_items[0][price_data][product_data][name]", course.title);
    if (course.description) {
      params.set("line_items[0][price_data][product_data][description]", course.description);
    }
    if (course.cover_image_url) {
      params.set("line_items[0][price_data][product_data][images][0]", course.cover_image_url);
    }
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[course_id]", courseId);
    params.set("metadata[email]", email);
    params.set("metadata[full_name]", fullName || "");
    params.set("metadata[language]", language);
    params.set("success_url", finalSuccessUrl);
    params.set("cancel_url", finalCancelUrl);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe error:", session);
      return new Response(
        JSON.stringify({ error: session.error?.message || "Failed to create checkout session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
