import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: NotificationPayload = await req.json();
    const { title, body, data } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetUserIds = payload.userIds || (payload.userId ? [payload.userId] : []);

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "userId or userIds is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: tokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .in("user_id", targetUserIds)
      .eq("is_active", true);

    if (tokenError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active push tokens found", sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fcmKey = Deno.env.get("FCM_SERVER_KEY");
    let sent = 0;

    for (const tokenRecord of tokens) {
      if (tokenRecord.platform === "android" && fcmKey) {
        const fcmResponse = await fetch(
          "https://fcm.googleapis.com/fcm/send",
          {
            method: "POST",
            headers: {
              Authorization: `key=${fcmKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: tokenRecord.token,
              notification: { title, body },
              data: data || {},
            }),
          }
        );
        if (fcmResponse.ok) sent++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Notifications processed",
        sent,
        total: tokens.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
