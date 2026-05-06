// Generate a Brand Strategy Blueprint by aggregating all stakeholder survey
// responses for a given client and passing them through the Lovable AI Gateway.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert Senior Brand Strategist for a premium branding agency. Your job is to analyze raw aggregate onboarding survey data from multiple stakeholders and synthesize it into a cohesive 'Brand Strategy Blueprint.'

You will receive the client's Name, Entity Type (Business or Organization), and an array of respondent data (allResponses).

CRITICAL INSTRUCTION: ROLE SEGMENTATION

Before analyzing, categorize each respondent in allResponses into one of three distinct relationship tiers based on their stated Role field:

1. INTERNAL: Employee
2. INVOLVED: Client (if Entity Type is Business) or Organization Member (if Entity Type is Organization)
3. PROXIMATE: Prospective Client (if Entity Type is Business) or Neighbor (if Entity Type is Organization)

You must look for trends, alignments, and disconnects between these three groups (e.g., Do Internal employees view the brand as 'Daring', while Proximate audiences view it as 'Traditional'?).

Return a beautifully structured Markdown report using the following exact sections and headings:

### 1. Perception Gap Analysis (Internal vs. External)
* **The Alignment:** Where do all groups fundamentally agree on the brand's identity?
* **The Disconnect:** Highlight major discrepancies. What is the Internal team seeing that the Proximate audience is missing (or vice versa)?

### 2. The Brand's Soul (Values & Attributes)
* **Core Values:** Based on the spectrum questions, identify the 3-4 defining values of the brand. Note any heavy splits between respondents.
* **Key Attributes:** Look at the 1-5 personality scale. List the top highest-rated attributes overall and write a one-sentence summary of how these traits blend together.

### 3. Core Brand Personality
* **Primary Personality:** Choose one dominant trait based on the 'Community Perception' data (Sincere, Exciting, Competent, Sophisticated, or Rugged). Explain why.
* **Secondary Personality:** Choose the runner-up trait and explain how it balances the Primary.

### 4. Voice + Tone
* Define the brand's voice using 3 distinct adjectives.
* Write a brief paragraph explaining *how* the brand should communicate to bridge any gaps identified in the Gap Analysis.

### 5. Brand Archetypes
* **Primary Archetype:** Select the most fitting standard brand archetype (e.g., Caregiver, Liberator, Creator, Sage, etc.) based on the data. Explain why.
* **Supporting Archetype:** Select a secondary archetype that adds nuance.

### 6. Visual & Aesthetic Projection
* CONDITIONAL: ONLY include this section if the response data actually contains aesthetic answers (keys prefixed with "aesthetic_"). If no aesthetic data is present, completely OMIT this entire section (including the heading) and renumber Target Audience Personas as section 6.
* Synthesize the aesthetic choices (Palette, Material, House, Vehicle, Dress, etc.) into a creative direction summary.

### 7. Target Audience Personas
* Based on the Entity Type and Proximate/Involved data, invent 2 realistic Target Audience profiles.
* Give each a catchy title (e.g., 'The Local-Minded' or 'The Efficiency Seeker') and write a two-sentence narrative about their desires and why this specific brand appeals to them.

If Entity Type is "Business", renumber section 7 as section 6 so the output flows naturally without a gap. Be specific, cite patterns from the data, and avoid generic marketing fluff.`;

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

    const allResponses = surveys.map((s) => s.responses);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

    const userPrompt = `Client Name: ${client.name}
Entity Type: ${client.entity_type}
Total Respondents: ${allResponses.length}

allResponses:
${JSON.stringify(allResponses, null, 2)}

Segment respondents by their Role field as instructed, then generate the Brand Strategy Blueprint now.`;

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
