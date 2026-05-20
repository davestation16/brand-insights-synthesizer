// Generate a Brand Strategy Blueprint by aggregating all stakeholder survey
// responses for a given client and passing them through the Lovable AI Gateway.
// Returns BOTH a Markdown report (for the UI) AND a strictly typed JSON
// `presentationData` object (consumed by the PDF deck).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateText, Output } from "npm:ai";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { z } from "npm:zod";

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

You must look for trends, alignments, and disconnects between these three groups.

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICTLY ENFORCED
═══════════════════════════════════════════════════════════════════

Return a SINGLE valid JSON object (no surrounding prose, no markdown code fences) with EXACTLY two top-level keys:

{
  "markdown": "<the full markdown report — see structure below>",
  "presentationData": { ... see schema below ... }
}

The "markdown" string must use the following exact section headings:

### 1. Perception Gap Analysis (Internal vs. External)
* **The Alignment:** Where all groups agree.
* **The Disconnect:** Major discrepancies between Internal/Involved/Proximate.

### 2. The Brand's Soul (Values & Attributes)
* **Core Values:** 3-4 defining values (nested bullets).
* **Key Attributes:** Top highest-rated traits with a one-sentence blend summary.

### 3. Core Brand Personality
* **Primary Personality:** Dominant trait + why.
* **Secondary Personality:** Runner-up + how it balances primary.

### 4. Voice + Tone
* 3 adjectives + paragraph on bridging gaps.

### 5. Brand Archetypes (The Supporting Character)
Use ONLY the custom Supporting Character Matrix (not Jungian):
The Caregiver, The Professor, The Wizard, The Damsel, The Artisan, The Jester, The Organizer, The Explorer, The Love Interest, The Liberator, The Knight.
* **Primary Supporting Character:** chosen archetype + how it applies.
* **Secondary Character(s):** 1-2 more if needed.

### 6. Visual & Aesthetic Projection
CONDITIONAL: only include if response data contains keys prefixed with "aesthetic_". Otherwise OMIT this section and renumber Personas as 6.

### 7. Target Audience Personas
2-3 invented profiles with catchy titles + two-sentence narratives.

═══════════════════════════════════════════════════════════════════
PRESENTATION DATA SCHEMA — POPULATE EVERY FIELD
═══════════════════════════════════════════════════════════════════

"presentationData": {
  "perceptionGap": {
    "alignment": string,         // 1-2 sentences
    "disconnect": string         // 1-2 sentences
  },
  "coreValues": [                // 3-4 items
    { "name": string, "description": string }
  ],
  "keyAttributes": {
    "pills": [string],           // 3-6 short trait words
    "summary": string            // one sentence blending them
  },
  "primaryPersonality": { "trait": string, "why": string },
  "secondaryPersonality": { "trait": string, "why": string },
  "voiceAdjectives": [string],   // exactly 3
  "voiceParagraph": string,
  "primaryArchetype": { "name": string, "description": string },
  "secondaryArchetypes": [       // 0-2 items
    { "name": string, "description": string }
  ],
  "aestheticDirection": string | null,   // null if no aesthetic_* data
  "personas": [                  // 2-3 items
    { "title": string, "narrative": string }
  ]
}

Rules for presentationData:
- All strings must be plain prose (NO markdown, NO asterisks, NO bullet markers).
- Keep value/persona descriptions to 1-3 sentences each so they fit a slide.
- Archetype "name" must start with "The " (e.g., "The Wizard").
- Personality objects must use "trait" for the trait name. Do not use "name".
- voiceAdjectives must be single words (e.g., "Confident", "Warm", "Direct").
- pills must be short single words or two-word phrases.
- Return ONLY the JSON object. No prose before or after. No \`\`\`json fences.`;

const PresentationDataSchema = z.object({
  perceptionGap: z.object({
    alignment: z.string(),
    disconnect: z.string(),
  }),
  coreValues: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).min(3).max(4),
  keyAttributes: z.object({
    pills: z.array(z.string()).min(3).max(6),
    summary: z.string(),
  }),
  primaryPersonality: z.object({ trait: z.string(), why: z.string() }),
  secondaryPersonality: z.object({ trait: z.string(), why: z.string() }),
  voiceAdjectives: z.array(z.string()).length(3),
  voiceParagraph: z.string(),
  primaryArchetype: z.object({ name: z.string(), description: z.string() }),
  secondaryArchetypes: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).max(2),
  aestheticDirection: z.string().nullable(),
  personas: z.array(z.object({
    title: z.string(),
    narrative: z.string(),
  })).min(2).max(3),
});

const BlueprintOutputSchema = z.object({
  markdown: z.string(),
  presentationData: PresentationDataSchema,
});

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

Segment respondents by their Role field as instructed, then return the JSON object with both "markdown" and "presentationData" now. Return ONLY the JSON object.`;

    const gateway = createOpenAICompatible({
      name: "lovable-ai",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": LOVABLE_API_KEY },
    });

    const { output: parsed } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      output: Output.object({ schema: BlueprintOutputSchema }),
      maxRetries: 2,
    });

    const blueprint = parsed.markdown;
    const presentationData = parsed.presentationData;

    const { error: updateErr } = await supabase
      .from("clients")
      .update({
        blueprint,
        presentation_data: presentationData,
        status: "completed",
      })
      .eq("id", clientId);
    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ success: true, blueprint, presentationData });
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
