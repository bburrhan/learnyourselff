import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error(message: string, status = 400, code?: string) {
  return json({ error: message, code: code ?? "ERROR" }, status);
}

function getSupabase(authHeader?: string | null) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const options = authHeader
    ? { global: { headers: { Authorization: authHeader } } }
    : {};
  return createClient(url, anonKey, options);
}

function getAdminSupabase() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

async function getAuthUser(authHeader: string | null) {
  if (!authHeader) return null;
  const supabase = getSupabase(authHeader);
  const { data: { user }, error: err } = await supabase.auth.getUser();
  if (err || !user) return null;
  return user;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, "");
    const segments = path.split("/").filter(Boolean);
    const authHeader = req.headers.get("Authorization");
    const method = req.method;

    // ── AUTH ─────────────────────────────────────────────────────────────────

    // POST /auth/register
    if (method === "POST" && segments[0] === "auth" && segments[1] === "register") {
      const { email, password, full_name } = await req.json();
      if (!email || !password) return error("email and password are required", 400, "MISSING_FIELDS");

      const admin = getAdminSupabase();
      const { data, error: signUpError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name ?? "" },
      });
      if (signUpError) return error(signUpError.message, 400, "REGISTER_FAILED");

      await admin.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: full_name ?? null,
        language_preference: "en",
      });

      const { data: session } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      const anonClient = getSupabase();
      const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({ email, password });
      if (loginError) return json({ user: { id: data.user.id, email } }, 201);

      return json({
        user: { id: data.user.id, email, full_name: full_name ?? null },
        access_token: loginData.session?.access_token,
        refresh_token: loginData.session?.refresh_token,
        expires_at: loginData.session?.expires_at,
      }, 201);
    }

    // POST /auth/login
    if (method === "POST" && segments[0] === "auth" && segments[1] === "login") {
      const { email, password } = await req.json();
      if (!email || !password) return error("email and password are required", 400, "MISSING_FIELDS");

      const supabase = getSupabase();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) return error(loginError.message, 401, "INVALID_CREDENTIALS");

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();

      return json({
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile?.full_name ?? null,
          language_preference: profile?.language_preference ?? "en",
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      });
    }

    // POST /auth/logout
    if (method === "POST" && segments[0] === "auth" && segments[1] === "logout") {
      const supabase = getSupabase(authHeader);
      await supabase.auth.signOut();
      return json({ success: true });
    }

    // POST /auth/refresh
    if (method === "POST" && segments[0] === "auth" && segments[1] === "refresh") {
      const { refresh_token } = await req.json();
      if (!refresh_token) return error("refresh_token is required", 400, "MISSING_FIELDS");

      const supabase = getSupabase();
      const { data, error: refreshError } = await supabase.auth.refreshSession({ refresh_token });
      if (refreshError || !data.session) return error("Invalid or expired refresh token", 401, "REFRESH_FAILED");

      return json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      });
    }

    // POST /auth/forgot-password
    if (method === "POST" && segments[0] === "auth" && segments[1] === "forgot-password") {
      const { email, redirect_url } = await req.json();
      if (!email) return error("email is required", 400, "MISSING_FIELDS");

      const supabase = getSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirect_url ?? undefined,
      });
      if (resetError) return error(resetError.message, 400, "RESET_FAILED");

      return json({ success: true, message: "Password reset email sent" });
    }

    // POST /auth/reset-password
    if (method === "POST" && segments[0] === "auth" && segments[1] === "reset-password") {
      const { password } = await req.json();
      if (!password) return error("password is required", 400, "MISSING_FIELDS");

      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const supabase = getSupabase(authHeader);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return error(updateError.message, 400, "UPDATE_FAILED");

      return json({ success: true, message: "Password updated successfully" });
    }

    // ── CATEGORIES ───────────────────────────────────────────────────────────

    // GET /categories
    if (method === "GET" && segments[0] === "categories" && !segments[1]) {
      const supabase = getSupabase();
      const { data, error: dbError } = await supabase
        .from("categories")
        .select("id, name, slug, description, color, icon, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (dbError) return error(dbError.message, 500, "DB_ERROR");
      return json({ categories: data });
    }

    // ── COURSES ──────────────────────────────────────────────────────────────

    // GET /courses
    if (method === "GET" && segments[0] === "courses" && !segments[1]) {
      const supabase = getSupabase();
      const params = url.searchParams;
      const language = params.get("language");
      const category = params.get("category");
      const search = params.get("search");
      const minPrice = params.get("min_price");
      const maxPrice = params.get("max_price");
      const isFeatured = params.get("is_featured");
      const page = parseInt(params.get("page") ?? "1");
      const limit = Math.min(parseInt(params.get("limit") ?? "20"), 100);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("courses")
        .select("id, title, description, price, currency, category, cover_image_url, tags, language, content_types, is_featured, created_at", { count: "exact" })
        .eq("is_active", true);

      if (language) query = query.eq("language", language);
      if (category) query = query.eq("category", category);
      if (isFeatured === "true") query = query.eq("is_featured", true);
      if (minPrice) query = query.gte("price", parseFloat(minPrice));
      if (maxPrice) query = query.lte("price", parseFloat(maxPrice));
      if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data, error: dbError, count } = await query;
      if (dbError) return error(dbError.message, 500, "DB_ERROR");

      return json({
        courses: data,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          total_pages: Math.ceil((count ?? 0) / limit),
        },
      });
    }

    // GET /courses/:id
    if (method === "GET" && segments[0] === "courses" && segments[1] && !segments[2]) {
      const courseId = segments[1];
      const supabase = getSupabase();

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("is_active", true)
        .maybeSingle();

      if (courseError) return error(courseError.message, 500, "DB_ERROR");
      if (!course) return error("Course not found", 404, "NOT_FOUND");

      const { data: contentList } = await supabase
        .from("course_content")
        .select("id, title, content_type, duration_seconds, sort_order, file_size")
        .eq("course_id", courseId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      return json({ course, content_preview: contentList ?? [] });
    }

    // GET /courses/:id/learn
    if (method === "GET" && segments[0] === "courses" && segments[1] && segments[2] === "learn") {
      const courseId = segments[1];
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const admin = getAdminSupabase();

      const { data: purchase } = await admin
        .from("purchases")
        .select("id, status")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .maybeSingle();

      if (!purchase) {
        const { data: course } = await admin.from("courses").select("price").eq("id", courseId).maybeSingle();
        if (!course || course.price > 0) return error("Access denied. Purchase required.", 403, "PURCHASE_REQUIRED");
      }

      const { data: contentList, error: contentError } = await admin
        .from("course_content")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (contentError) return error(contentError.message, 500, "DB_ERROR");

      const contentWithUrls = await Promise.all(
        (contentList ?? []).map(async (item) => {
          let signedUrl: string | null = null;
          if (item.file_url) {
            const bucketPath = item.file_url.split("/storage/v1/object/public/")[1];
            if (bucketPath) {
              const [bucket, ...pathParts] = bucketPath.split("/");
              const filePath = pathParts.join("/");
              const { data: signed } = await admin.storage
                .from(bucket)
                .createSignedUrl(filePath, 3600);
              signedUrl = signed?.signedUrl ?? item.file_url;
            }
          }
          return { ...item, signed_url: signedUrl ?? item.file_url };
        })
      );

      return json({ content: contentWithUrls });
    }

    // GET /courses/:id/progress
    if (method === "GET" && segments[0] === "courses" && segments[1] && segments[2] === "progress") {
      const courseId = segments[1];
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const supabase = getSupabase(authHeader);
      const { data, error: dbError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      if (dbError) return error(dbError.message, 500, "DB_ERROR");

      const completed = (data ?? []).filter((p) => p.completed).length;
      const total = (data ?? []).length;
      const overall_percent = total > 0
        ? Math.round((data ?? []).reduce((sum, p) => sum + (p.progress_percent ?? 0), 0) / total)
        : 0;

      return json({ progress: data ?? [], completed_items: completed, total_items: total, overall_percent });
    }

    // POST /courses/:id/progress
    if (method === "POST" && segments[0] === "courses" && segments[1] && segments[2] === "progress") {
      const courseId = segments[1];
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const { content_id, progress_seconds, progress_percent, completed } = await req.json();
      if (!content_id) return error("content_id is required", 400, "MISSING_FIELDS");

      const supabase = getSupabase(authHeader);
      const { data, error: upsertError } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          course_id: courseId,
          content_id,
          progress_seconds: progress_seconds ?? 0,
          progress_percent: progress_percent ?? 0,
          completed: completed ?? false,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,course_id,content_id" })
        .select()
        .maybeSingle();

      if (upsertError) return error(upsertError.message, 500, "DB_ERROR");
      return json({ progress: data });
    }

    // ── USER (ME) ────────────────────────────────────────────────────────────

    // GET /me
    if (method === "GET" && segments[0] === "me" && !segments[1]) {
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const supabase = getSupabase(authHeader);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      return json({ user: { id: user.id, email: user.email, ...profile } });
    }

    // PATCH /me
    if (method === "PATCH" && segments[0] === "me" && !segments[1]) {
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const { full_name, language_preference } = await req.json();
      const supabase = getSupabase(authHeader);

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (full_name !== undefined) updates.full_name = full_name;
      if (language_preference !== undefined) updates.language_preference = language_preference;

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .maybeSingle();

      if (updateError) return error(updateError.message, 500, "DB_ERROR");
      return json({ user: data });
    }

    // GET /me/courses
    if (method === "GET" && segments[0] === "me" && segments[1] === "courses") {
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const supabase = getSupabase(authHeader);
      const { data: purchases, error: purchaseError } = await supabase
        .from("purchases")
        .select("id, course_id, status, amount, currency, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (purchaseError) return error(purchaseError.message, 500, "DB_ERROR");

      const courseIds = (purchases ?? []).map((p) => p.course_id);
      if (courseIds.length === 0) return json({ courses: [] });

      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, description, cover_image_url, content_types, language, category")
        .in("id", courseIds);

      const { data: progressRows } = await supabase
        .from("user_progress")
        .select("course_id, progress_percent, completed")
        .eq("user_id", user.id)
        .in("course_id", courseIds);

      const progressByCourse: Record<string, { total: number; sum: number; completed: number }> = {};
      for (const row of progressRows ?? []) {
        if (!progressByCourse[row.course_id]) progressByCourse[row.course_id] = { total: 0, sum: 0, completed: 0 };
        progressByCourse[row.course_id].total += 1;
        progressByCourse[row.course_id].sum += row.progress_percent ?? 0;
        if (row.completed) progressByCourse[row.course_id].completed += 1;
      }

      const enriched = (courses ?? []).map((c) => {
        const p = progressByCourse[c.id];
        const purchase = purchases?.find((pu) => pu.course_id === c.id);
        return {
          ...c,
          purchase_id: purchase?.id,
          purchased_at: purchase?.created_at,
          overall_progress: p ? Math.round(p.sum / p.total) : 0,
          completed_items: p?.completed ?? 0,
          total_items: p?.total ?? 0,
        };
      });

      return json({ courses: enriched });
    }

    // GET /me/purchases
    if (method === "GET" && segments[0] === "me" && segments[1] === "purchases") {
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const supabase = getSupabase(authHeader);
      const { data, error: dbError } = await supabase
        .from("purchases")
        .select("id, course_id, amount, currency, status, stripe_payment_id, created_at, download_count, last_download_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dbError) return error(dbError.message, 500, "DB_ERROR");

      const courseIds = (data ?? []).map((p) => p.course_id);
      const { data: courses } = courseIds.length
        ? await supabase.from("courses").select("id, title, cover_image_url").in("id", courseIds)
        : { data: [] };

      const courseMap = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));
      const enriched = (data ?? []).map((p) => ({ ...p, course: courseMap[p.course_id] ?? null }));

      return json({ purchases: enriched });
    }

    // POST /me/push-token
    if (method === "POST" && segments[0] === "me" && segments[1] === "push-token") {
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const { token, platform } = await req.json();
      if (!token) return error("token is required", 400, "MISSING_FIELDS");

      const admin = getAdminSupabase();
      const { error: upsertError } = await admin
        .from("push_tokens")
        .upsert({ user_id: user.id, token, platform: platform ?? "unknown", updated_at: new Date().toISOString() }, { onConflict: "user_id,token" });

      if (upsertError) return error(upsertError.message, 500, "DB_ERROR");
      return json({ success: true });
    }

    // ── CHECKOUT ─────────────────────────────────────────────────────────────

    // POST /checkout/free
    if (method === "POST" && segments[0] === "checkout" && segments[1] === "free") {
      const { course_id, email, full_name, language } = await req.json();
      if (!course_id || !email) return error("course_id and email are required", 400, "MISSING_FIELDS");

      const admin = getAdminSupabase();
      const { data: course } = await admin.from("courses").select("*").eq("id", course_id).eq("is_active", true).maybeSingle();
      if (!course) return error("Course not found", 404, "NOT_FOUND");
      if (course.price > 0) return error("This course is not free", 400, "NOT_FREE");

      const user = await getAuthUser(authHeader);

      const { data: existing } = await admin
        .from("purchases")
        .select("id")
        .eq("course_id", course_id)
        .eq("email", email)
        .eq("status", "completed")
        .maybeSingle();

      if (existing) return json({ purchase_id: existing.id, message: "Already enrolled" });

      const { data: purchase, error: insertError } = await admin
        .from("purchases")
        .insert({
          course_id,
          email,
          user_id: user?.id ?? null,
          stripe_payment_id: `free_${Date.now()}`,
          amount: 0,
          currency: course.currency ?? "USD",
          status: "completed",
        })
        .select()
        .maybeSingle();

      if (insertError) return error(insertError.message, 500, "DB_ERROR");

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      fetch(`${supabaseUrl}/functions/v1/send-course-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({
          purchaseId: purchase!.id,
          email,
          fullName: full_name ?? "",
          courseTitle: course.title,
          courseId: course_id,
          courseUrl: `${supabaseUrl.replace(".supabase.co", "")}/${language ?? "en"}/learn/${course_id}`,
          isFree: true,
          language: language ?? "en",
        }),
      }).catch(() => {});

      return json({ purchase_id: purchase!.id, message: "Enrolled successfully" }, 201);
    }

    // POST /checkout/stripe
    if (method === "POST" && segments[0] === "checkout" && segments[1] === "stripe") {
      const { course_id, email, full_name, success_url, cancel_url, language } = await req.json();
      if (!course_id || !email) return error("course_id and email are required", 400, "MISSING_FIELDS");

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({
          courseId: course_id,
          email,
          fullName: full_name ?? "",
          successUrl: success_url ?? `${supabaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: cancel_url ?? `${supabaseUrl}/courses/${course_id}?canceled=true`,
          language: language ?? "en",
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return error(body.error ?? "Failed to create checkout session", response.status, "STRIPE_ERROR");
      }

      const data = await response.json();
      return json(data);
    }

    // GET /checkout/verify/:purchaseId
    if (method === "GET" && segments[0] === "checkout" && segments[1] === "verify" && segments[2]) {
      const purchaseId = segments[2];
      const user = await getAuthUser(authHeader);
      if (!user) return error("Unauthorized", 401, "UNAUTHORIZED");

      const admin = getAdminSupabase();
      const { data: purchase, error: dbError } = await admin
        .from("purchases")
        .select("id, status, course_id, amount, currency, created_at")
        .eq("id", purchaseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (dbError) return error(dbError.message, 500, "DB_ERROR");
      if (!purchase) return error("Purchase not found", 404, "NOT_FOUND");

      return json({ purchase });
    }

    // ── BLOG ─────────────────────────────────────────────────────────────────

    // GET /blog
    if (method === "GET" && segments[0] === "blog" && !segments[1]) {
      const supabase = getSupabase();
      const params = url.searchParams;
      const language = params.get("language");
      const page = parseInt(params.get("page") ?? "1");
      const limit = Math.min(parseInt(params.get("limit") ?? "10"), 50);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("blog_posts")
        .select("id, title, excerpt, slug, author_name, cover_image_url, tags, language, created_at, updated_at", { count: "exact" })
        .eq("is_published", true);

      if (language) query = query.eq("language", language);
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data, error: dbError, count } = await query;
      if (dbError) return error(dbError.message, 500, "DB_ERROR");

      return json({
        posts: data,
        pagination: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) },
      });
    }

    // GET /blog/:slug
    if (method === "GET" && segments[0] === "blog" && segments[1]) {
      const slug = segments[1];
      const supabase = getSupabase();

      const { data, error: dbError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (dbError) return error(dbError.message, 500, "DB_ERROR");
      if (!data) return error("Blog post not found", 404, "NOT_FOUND");

      return json({ post: data });
    }

    // ── FALLBACK ─────────────────────────────────────────────────────────────
    return error(`Route not found: ${method} ${path}`, 404, "ROUTE_NOT_FOUND");

  } catch (err) {
    console.error("API Error:", err);
    return error("Internal server error", 500, "INTERNAL_ERROR");
  }
});
