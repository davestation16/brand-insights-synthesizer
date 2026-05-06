// Public survey bootstrap.
// - action=lookup: returns minimal client info ({id, name, entity_type}) for a given survey_uid.
// - action=verify: validates an access_code for that survey_uid and returns the
//   matching survey template content. Never returns the access_code or blueprint.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { uid, action, accessCode } = await req.json();
    if (!uid || typeof uid !== "string") return json({ error: "Missing uid" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: client, error } = await supabase
      .from("clients")
      .select("id, name, entity_type, access_code")
      .eq("survey_uid", uid)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!client) return json({ error: "Not found" }, 404);

    if (action === "verify") {
      if (!accessCode || accessCode !== client.access_code) {
        return json({ error: "Invalid access code" }, 403);
      }
      const { data: tpl } = await supabase
        .from("survey_templates")
        .select("content")
        .eq("entity_type", client.entity_type)
        .maybeSingle();
      return json({
        client: { id: client.id, name: client.name, entity_type: client.entity_type },
        template: tpl?.content ?? null,
      });
    }

    // Default: lookup — never expose access_code
    return json({
      client: { id: client.id, name: client.name, entity_type: client.entity_type },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
