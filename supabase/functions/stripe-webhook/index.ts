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
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment processing is not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Record<string, unknown>;

    if (webhookSecret && signature) {
      const isValid = await verifyStripeSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid Stripe webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    try {
      event = JSON.parse(body);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe webhook event type:", event.type);

    if (event.type !== "checkout.session.completed") {
      return new Response(
        JSON.stringify({ received: true, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = event.data as Record<string, unknown>;
    const sessionObj = session.object as Record<string, unknown>;

    if (sessionObj.payment_status !== "paid") {
      console.log("Session not paid, skipping. Status:", sessionObj.payment_status);
      return new Response(
        JSON.stringify({ received: true, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metadata = sessionObj.metadata as Record<string, string> | null;
    const courseId = metadata?.course_id;
    const email = (sessionObj.customer_email as string) || metadata?.email;
    const fullName = metadata?.full_name || "";
    const language = metadata?.language || "en";
    const stripePaymentId = (sessionObj.payment_intent as string) || (sessionObj.id as string);
    const amountTotal = (sessionObj.amount_total as number) ?? 0;
    const currency = ((sessionObj.currency as string) || "usd").toUpperCase();

    if (!courseId || !email) {
      console.error("Missing metadata in webhook session - courseId:", courseId, "email:", email);
      return new Response(
        JSON.stringify({ error: "Missing course or email in session metadata" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: existingPurchase } = await admin
      .from("purchases")
      .select("id")
      .eq("stripe_payment_id", stripePaymentId)
      .maybeSingle();

    if (existingPurchase) {
      console.log("Purchase already exists for payment_id:", stripePaymentId);
      return new Response(
        JSON.stringify({ received: true, already_processed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: course } = await admin
      .from("courses")
      .select("id, title")
      .eq("id", courseId)
      .maybeSingle();

    if (!course) {
      console.error("Course not found in webhook:", courseId);
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isNewUser = true;
    let userId: string | null = null;

    const { data: userList } = await admin.auth.admin.listUsers();
    const matchedUser = userList?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (matchedUser) {
      isNewUser = false;
      userId = matchedUser.id;
    }

    if (!userId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (profile) {
        userId = profile.id;
        isNewUser = false;
      }
    }

    if (isNewUser && !userId) {
      const tempPassword = crypto.randomUUID().replace(/-/g, "") + "Aa1!";

      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, language_preference: language },
      });

      if (createError) {
        console.error("Webhook: failed to create user account:", createError);
      } else {
        userId = newUser.user.id;
        console.log("Webhook: created confirmed user account:", userId);

        await admin.from("profiles").upsert({
          id: userId,
          email,
          full_name: fullName || null,
          language_preference: language,
        });
      }
    }

    console.log("Webhook: inserting purchase userId:", userId, "courseId:", courseId, "email:", email);

    const { data: purchase, error: purchaseError } = await admin
      .from("purchases")
      .insert({
        user_id: userId,
        course_id: courseId,
        email,
        stripe_payment_id: stripePaymentId,
        amount: amountTotal / 100,
        currency,
        status: "completed",
      })
      .select()
      .maybeSingle();

    if (purchaseError) {
      console.error("Webhook: failed to create purchase record:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to record purchase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Webhook: purchase created successfully:", purchase?.id);

    return new Response(
      JSON.stringify({ received: true, purchase_id: purchase?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));
    if (!tPart || !v1Part) return false;

    const timestamp = tPart.slice(2);
    const expectedSig = v1Part.slice(3);
    const signedPayload = `${timestamp}.${payload}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    );

    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSig === expectedSig;
  } catch {
    return false;
  }
}
