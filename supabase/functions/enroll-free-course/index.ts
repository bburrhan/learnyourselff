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
    const { courseId, email, fullName, language = "en" } = await req.json();

    if (!courseId || !email) {
      return new Response(
        JSON.stringify({ error: "courseId and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: course } = await admin
      .from("courses")
      .select("id, title, price, currency")
      .eq("id", courseId)
      .eq("is_active", true)
      .maybeSingle();

    if (!course) {
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (course.price !== 0) {
      return new Response(
        JSON.stringify({ error: "This course is not free" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isNewUser = true;
    let userId: string | null = null;
    let tempPassword: string | null = null;

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
      tempPassword = crypto.randomUUID().replace(/-/g, "") + "Aa1!";

      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName || "", language_preference: language },
      });

      if (createError) {
        console.error("Failed to create user account:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      console.log("Created confirmed user account for free enrollment:", userId);

      await admin.from("profiles").upsert({
        id: userId,
        email,
        full_name: fullName || null,
        language_preference: language,
      });
    }

    const { data: existingPurchase } = await admin
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("status", "completed")
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({
          success: true,
          already_enrolled: true,
          purchase_id: existingPurchase.id,
          course_id: courseId,
          course_title: course.title,
          email,
          is_new_user: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: purchase, error: purchaseError } = await admin
      .from("purchases")
      .insert({
        user_id: userId,
        course_id: courseId,
        email,
        stripe_payment_id: `free_${Date.now()}`,
        amount: 0,
        currency: course.currency,
        status: "completed",
      })
      .select()
      .maybeSingle();

    if (purchaseError) {
      console.error("Failed to create free enrollment record:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to record enrollment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Free enrollment created:", purchase?.id, "for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        purchase_id: purchase!.id,
        course_id: courseId,
        course_title: course.title,
        email,
        full_name: fullName || "",
        amount: 0,
        currency: course.currency,
        is_new_user: isNewUser,
        temp_password: isNewUser ? tempPassword : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("enroll-free-course error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
