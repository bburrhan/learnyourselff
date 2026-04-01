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

    console.log("verify-checkout-session called with sessionId:", sessionId);

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

    console.log("Stripe session payment_status:", session.payment_status, "session_id:", session.id);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", payment_status: session.payment_status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const courseId = session.metadata?.course_id;
    const phoneNumber = session.metadata?.phone_number || "";
    const fullName = session.metadata?.full_name || "";
    const realEmail = (session.customer_details?.email as string) || null;

    if (!courseId) {
      console.error("Missing courseId in session metadata");
      return new Response(
        JSON.stringify({ error: "Missing course information in session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const stripePaymentId = session.payment_intent || sessionId;

    const { data: existingPurchase } = await admin
      .from("purchases")
      .select("id")
      .eq("stripe_payment_id", stripePaymentId)
      .maybeSingle();

    if (existingPurchase) {
      const { data: course } = await admin
        .from("courses")
        .select("id, title, price, currency")
        .eq("id", courseId)
        .maybeSingle();

      console.log("Purchase already exists:", existingPurchase.id);

      return new Response(
        JSON.stringify({
          success: true,
          already_processed: true,
          purchase_id: existingPurchase.id,
          course_id: courseId,
          course_title: course?.title,
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
      console.error("Course not found:", courseId);
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId: string | null = null;

    if (phoneNumber) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("phone_number", phoneNumber)
        .maybeSingle();
      if (profile) {
        userId = profile.id;
        console.log("Found user by phone_number:", userId);
      }
    }

    if (userId && realEmail) {
      console.log("verify-checkout-session: updating user email to:", realEmail, "for userId:", userId);
      await admin.auth.admin.updateUserById(userId, {
        email: realEmail,
        email_confirm: true,
      });
      await admin
        .from("profiles")
        .update({ email: realEmail })
        .eq("id", userId);
    }

    const purchaseEmail = realEmail
      || (phoneNumber ? `${phoneNumber.replace(/\+/g, "")}@noemail.learnyourself.app` : "unknown@noemail.learnyourself.app");

    console.log("Inserting purchase for userId:", userId, "courseId:", courseId, "email:", purchaseEmail);

    const { data: purchase, error: purchaseError } = await admin
      .from("purchases")
      .insert({
        user_id: userId,
        course_id: courseId,
        email: purchaseEmail,
        stripe_payment_id: stripePaymentId,
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

    console.log("Purchase created successfully:", purchase?.id);

    return new Response(
      JSON.stringify({
        success: true,
        purchase_id: purchase!.id,
        course_id: courseId,
        course_title: course.title,
        full_name: fullName,
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency?.toUpperCase() ?? "USD",
        is_new_user: false,
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
