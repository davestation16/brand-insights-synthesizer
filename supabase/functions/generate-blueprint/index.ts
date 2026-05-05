// Generate a Brand Strategy Blueprint by aggregating all stakeholder survey
// responses for a given client and passing them through the Lovable AI Gateway.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an elite brand strategist synthesizing input from multiple stakeholders for a single client.

You will receive an array of stakeholder survey responses. Each response carries a "role" categorizing the respondent as one of:
- Internal: founders, leadership, employees inside the organization
- Involved: close partners, contractors, advisors actively engaged with the brand
- Proximate: customers, community members, peripheral observers

Your job:
1. Identify TRENDS — themes, language, and beliefs that show up consistently across roles.
2. Identify GAPS — meaningful divergences between how Internal, Involved, and Proximate groups perceive the brand.
3. Translate those insights into a sharp, actionable Brand Strategy Blueprint.

Output a single Markdown document with these sections:
# Brand Strategy Blueprint
## Executive Summary
## Aggregate Perception (Trends across all roles)
## Perception Gaps (Internal vs Involved vs Proximate)
## Positioning Statement
## Audience & Voice
## Strategic Recommendations
## Risks & Watch-outs

Be specific, cite patterns from the data, and avoid generic marketing fluff.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientId } = await req.json();
    if (!clientId) return json({ error: "Missing clientId" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, name, entity_type")
      .eq("id", clientId)
      .maybeSingle();
    if (clientErr || !client) return json({ error: "Client not found" }, 404);

    const { data: surveys, error: surveysErr } = await supabase
      .from("surveys")
      .select("responses")
      .eq("client_id", clientId);
    if (surveysErr) return json({ error: surveysErr.message }, 500);
    if (!surveys || surveys.length === 0) {
      return json({ error: "No survey responses found for this client" }, 400);
    }

    const aggregateResponses = surveys.map((s) => s.responses);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const userPrompt = `Client: ${client.name} (${client.entity_type})

Aggregate stakeholder responses (${aggregateResponses.length} total):

${JSON.stringify(aggregateResponses, null, 2)}

Generate the Brand Strategy Blueprint now.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limits exceeded, please try again later." }, 429);
      if (aiResp.status === 402) return json({ error: "Payment required, please add credits to your Lovable AI workspace." }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const aiData = await aiResp.json();
    const blueprint: string = aiData?.choices?.[0]?.message?.content ?? "";
    if (!blueprint) return json({ error: "AI returned empty blueprint" }, 500);

    const { error: updateErr } = await supabase
      .from("clients")
      .update({ blueprint, status: "completed" })
      .eq("id", clientId);
    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ success: true, blueprint });
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
