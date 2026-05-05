// Submit a brand-onboarding survey response.
// Validates the access code, inserts the response, and increments the
// client's response_count. AI strategy generation is triggered separately
// once the agency has collected enough stakeholder responses.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientId, responses, accessCode } = await req.json();
    if (!clientId || !responses || !accessCode) {
      return json({ error: "Missing required fields" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify access code
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, access_code, response_count")
      .eq("id", clientId)
      .maybeSingle();

    if (clientErr || !client) return json({ error: "Client not found" }, 404);
    if (client.access_code !== accessCode) return json({ error: "Invalid access code" }, 403);

    // Insert survey response
    const { error: insertErr } = await supabase
      .from("surveys")
      .insert({ client_id: clientId, responses, access_code: accessCode });
    if (insertErr) return json({ error: insertErr.message }, 500);

    // Increment stakeholder response counter; status stays "pending"
    const { error: updateErr } = await supabase
      .from("clients")
      .update({ response_count: (client.response_count ?? 0) + 1 })
      .eq("id", clientId);
    if (updateErr) console.error("response_count update failed:", updateErr);

    return json({ success: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
