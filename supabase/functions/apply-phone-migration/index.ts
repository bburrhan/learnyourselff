import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const sqls = [
      `ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone_number') THEN ALTER TABLE profiles ADD COLUMN phone_number text; END IF; END $$`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='whatsapp_verified') THEN ALTER TABLE profiles ADD COLUMN whatsapp_verified boolean NOT NULL DEFAULT false; END IF; END $$`,
      `CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_idx ON profiles (phone_number) WHERE phone_number IS NOT NULL`,
      `ALTER TABLE purchases ALTER COLUMN email DROP NOT NULL`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='phone_number') THEN ALTER TABLE purchases ADD COLUMN phone_number text; END IF; END $$`,
      `CREATE TABLE IF NOT EXISTS whatsapp_otps (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), phone_number text NOT NULL, otp_code text NOT NULL, purpose text NOT NULL DEFAULT 'login' CHECK (purpose IN ('login','signup','checkout')), expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'), verified boolean NOT NULL DEFAULT false, attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now())`,
      `CREATE INDEX IF NOT EXISTS whatsapp_otps_phone_expires_idx ON whatsapp_otps (phone_number, expires_at)`,
      `CREATE INDEX IF NOT EXISTS whatsapp_otps_phone_purpose_idx ON whatsapp_otps (phone_number, purpose, verified)`,
      `ALTER TABLE whatsapp_otps ENABLE ROW LEVEL SECURITY`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_otps' AND policyname='No direct client access to OTPs') THEN EXECUTE $p$CREATE POLICY "No direct client access to OTPs" ON whatsapp_otps FOR SELECT TO authenticated USING (false)$p$; END IF; END $$`,
    ];

    const results = [];
    for (const sql of sqls) {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      });
      results.push({ sql: sql.substring(0, 80), status: res.status, ok: res.ok });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
