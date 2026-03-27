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

    const defaultSuccessUrl = successUrl || `${supabaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = cancelUrl || `${supabaseUrl}/courses/${courseId}?canceled=true`;

    const sessionPayload = {
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: priceInCents,
            product_data: {
              name: course.title,
              description: course.description || undefined,
              images: course.cover_image_url ? [course.cover_image_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        course_id: courseId,
        email,
        full_name: fullName || "",
        language,
      },
      success_url: defaultSuccessUrl,
      cancel_url: defaultCancelUrl,
    };

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(flattenForStripe(sessionPayload)).toString(),
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

function flattenForStripe(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          Object.assign(result, flattenForStripe(item as Record<string, unknown>, `${fullKey}[${i}]`));
        } else {
          result[`${fullKey}[${i}]`] = String(item);
        }
      });
    } else if (typeof value === "object") {
      Object.assign(result, flattenForStripe(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}
