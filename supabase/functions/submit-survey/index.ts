// Submit a brand-onboarding survey response and generate the AI Brand Strategy Blueprint
// via the Lovable AI Gateway. Public endpoint (verify_jwt = false).

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
      .select("id, name, entity_type, access_code")
      .eq("id", clientId)
      .maybeSingle();

    if (clientErr || !client) return json({ error: "Client not found" }, 404);
    if (client.access_code !== accessCode) return json({ error: "Invalid access code" }, 403);

    // Insert survey response
    const { data: survey, error: insertErr } = await supabase
      .from("surveys")
      .insert({ client_id: clientId, responses, access_code: accessCode })
      .select()
      .single();
    if (insertErr) return json({ error: insertErr.message }, 500);

    await supabase.from("clients").update({ status: "completed" }).eq("id", clientId);

    // Generate blueprint via Lovable AI Gateway
    const { data: allSurveys } = await supabase
      .from("surveys")
      .select("responses")
      .eq("client_id", clientId);

    const allResponses = (allSurveys ?? []).map((s: any) => s.responses);

    const prompt = `
You are an expert Senior Brand Strategist for a premium branding agency. Your job is to analyze raw onboarding survey data from a client and synthesize it into a cohesive 'Brand Strategy Blueprint.'

You will receive a JSON payload containing the client's Entity Type (Business or Organization), and a list of respondent data containing their Roles and their ratings across Brand Personality, Brand Values, Community Perception, and Aesthetic Choices.

### CLIENT CONTEXT
- **Name:** ${client.name}
- **Entity Type:** ${client.entity_type}

### RESPONDENT DATA SET
${JSON.stringify(allResponses, null, 2)}

CRITICAL INSTRUCTION: ROLE SEGMENTATION
Before analyzing the data, you must categorize the respondents into three distinct relationship tiers:
1. INTERNAL: Employees
2. INVOLVED: Clients (if Business) or Organization Members (if Organization)
3. PROXIMATE: Prospective Clients (if Business) or Neighbors (if Organization)

As you build the blueprint, you must look for trends, alignments, and disconnects between these three groups.

Analyze the data and return a beautifully structured Markdown report using the following exact sections:

### 1. Perception Gap Analysis (Internal vs. Involved vs. Proximate)
* **The Alignment:** Where do all three groups fundamentally agree on the brand's identity and values?
* **The Disconnect:** Highlight the major discrepancies.

### 2. The Brand's Soul (Values & Attributes)
* **Core Values:** Based on the 1-10 spectrum sliders, identify the 3-4 defining values of the brand.
* **Key Attributes:** Look at the 1-5 personality scale. List the top 4-5 highest-rated attributes overall.

### 3. Core Brand Personality
* **Primary Personality:** Choose one dominant trait (Sincere, Exciting, Competent, Sophisticated, or Rugged).
* **Secondary Personality:** Choose the runner-up trait and explain how it balances the primary.

### 4. Voice + Tone
* Define the brand's voice using 3 distinct adjectives.
* Write a brief paragraph explaining how the brand should communicate.

### 5. Brand Archetypes
* **Primary Archetype:** Select the most fitting brand archetype.
* **Supporting Archetype:** Select a secondary archetype.

### 6. Visual & Aesthetic Projection
* Synthesize the aesthetic choices (Palette, Material, House, Vehicle, Dress).
* Translate these choices into a creative direction summary.

### 7. Target Audience Personas
* Invent 2-3 realistic Target Audience profiles with catchy titles and two-sentence narratives.
`;

    let blueprint = "";
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        blueprint = aiJson?.choices?.[0]?.message?.content ?? "";
      } else {
        console.error("AI gateway error:", aiRes.status, await aiRes.text());
      }
    } catch (e) {
      console.error("AI call failed:", e);
    }

    if (blueprint) {
      await supabase
        .from("surveys")
        .update({ blueprint, processed_at: new Date().toISOString() })
        .eq("id", survey.id);
    }

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
