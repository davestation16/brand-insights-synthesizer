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

STRICT CLOSED LIST — You MUST choose primary and secondary archetypes ONLY from these 11 proprietary Supporting Characters. Any other archetype name (e.g., The Ruler, The Creator, The Outlaw, The Hero, The Sage, The Innocent, The Everyman, The Lover, The Magician, The Rebel — generic Jungian/Jung-Pearson archetypes) is STRICTLY FORBIDDEN and will cause the output to be rejected.

The 11 allowed Supporting Characters (name — role — associated verbs):
1. The Caregiver — Assists in meeting physical needs: food, clothing, shelter, medical care. — Verbs: Nurture, Provide
2. The Professor — Provides knowledge, wisdom, and a listening ear. — Verbs: Instruct, Listen, Mentor
3. The Wizard — Creates "magical" solutions to problems, both impossible and everyday (simplifying complex technology or operations). — Verbs: Create, Solve, Simplify
4. The Damsel — In need of assistance; provides a reason for the protagonist's adventure and a sense of fulfillment when aided (highly relevant for non-profits or donor engagement). — Verbs: Need, Fulfill
5. The Artisan — Provides necessary items to ease the protagonist's quest; can source items and provide advice about the correct tool to use. — Verbs: Source, Procure
6. The Jester — Provides entertainment, as well as wisdom. — Verbs: Entertain, Amuse
7. The Organizer — Establishes community, maintains community, sets standards within a community. — Verbs: Organize, Maintain
8. The Explorer — Informs about the wider world; brings back knowledge and goods from other places. — Verbs: Introduce, Infuse
9. The Love Interest — Gives the protagonist something to chase, to desire, to work for. — Verbs: Seduce, Thrill
10. The Liberator — Rescues the hero from captivity; provides an escape from the everyday world. — Verbs: Free, Save
11. The Knight — Protects the hero; stands in between the hero and danger (perfect for legal, security, or high-risk financial compliance shields). — Verbs: Protect, Secure

PROPRIETARY 3-STEP REVERSE-ENGINEERING WORKFLOW — execute in this order before naming the archetype:
1. Review the generated target audience personas and isolate their deepest vulnerability, frustration, or core quest.
2. Determine which of the 11 allowed Supporting Characters acts as the mathematically perfect structural counterweight to that specific persona gap (e.g., a firm offering complex accounting that protects wealth from tax minefields is NOT "The Organizer" — it is "The Knight" protecting the hero from danger using Protect/Secure logic).
3. Read the provided client context (name, entity type, aggregated responses) to ensure the chosen character accurately reflects the actual economic or spiritual value the brand offers, bypassing flat or superficial industry clichés.

* **Primary Supporting Character:** chosen archetype + how it applies (must be one of the 11).
* **Secondary Character(s):** 1-2 more if needed (each must be one of the 11).

### 6. Visual & Aesthetic Projection
CONDITIONAL: only include if response data contains keys prefixed with "aesthetic_". Otherwise OMIT this section and renumber Personas as 6.

### 7. Target Audience Personas
2-3 invented profiles with catchy titles + two-sentence narratives.

═══════════════════════════════════════════════════════════════════
PRESENTATION DATA SCHEMA — POPULATE EVERY FIELD
═══════════════════════════════════════════════════════════════════

"presentationData": {
  "perceptionGap": {
    "alignment": string,         // 3-4 sentence paragraph synthesizing where Internal/Involved/Proximate agree
    "disconnect": string         // 3-4 sentence paragraph on key friction or perception gaps (e.g., innovation, sophistication)
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
  "voiceAndTone": {
    "adjectives": [string],              // exactly 3 single words
    "inPractice": string,                // 3-4 sentences describing exactly how the brand sounds across marketing channels
    "communicationStrategy": string,     // 3-4 sentences on how to bridge the perception gap or communicate through transitions
    "dosAndDonts": [string]              // 3-4 action rules prefixed "DO: ..." or "DON'T: ..."
  },
  "primaryArchetype": {
    "name": string,              // STRICT: exactly one of the 11 allowed Supporting Characters (must start with "The ")
    "verbs": [string],           // the associated verbs for that character, taken verbatim from the matrix above
    "description": string        // deep agency-grade copy block explaining exactly how this specific supporting character role solves the target persona's quest or anxiety
  },
  "secondaryArchetypes": [       // 0-2 items, each from the same 11-option closed list
    { "name": string, "verbs": [string], "description": string }
  ],
  "aesthetic": {                 // null if NO aesthetic_* keys exist in responses
    "summary": string,           // one overarching visual vibe sentence
    "palette": string,           // color breakdown + psychological mood
    "materials": string,         // material cues and tactile textures
    "style": string              // core architectural / design approach rules
  } | null,
  "personas": [                  // 2-3 items
    { "title": string, "narrative": string }
  ]
}

Rules for presentationData:
- All strings must be plain prose (NO markdown, NO asterisks, NO bullet markers).
- Keep value/persona descriptions to 1-3 sentences each so they fit a slide.
- Archetype "name" MUST be EXACTLY one of: "The Caregiver", "The Professor", "The Wizard", "The Damsel", "The Artisan", "The Jester", "The Organizer", "The Explorer", "The Love Interest", "The Liberator", "The Knight". No other value is acceptable.
- Archetype "verbs" MUST match the associated verbs for the chosen character exactly as listed in the Supporting Character matrix above.
- Archetype "description" must explicitly tie the chosen character's role and verbs to the specific persona vulnerability or quest identified in the 3-step workflow.
- Personality objects must use "trait" for the trait name. Do not use "name".
- voiceAndTone.adjectives must be single words (e.g., "Confident", "Warm", "Direct").
- voiceAndTone.inPractice and voiceAndTone.communicationStrategy must each be 3-4 substantive sentences — put on a copywriter hat, no terse summaries.
- voiceAndTone.dosAndDonts: each item starts with "DO:" or "DON'T:" followed by an actionable operational rule.
- perceptionGap.alignment and perceptionGap.disconnect must each be a full 3-4 sentence paragraph.
- pills must be short single words or two-word phrases.
- aesthetic: return null ONLY if no aesthetic_* keys are present in the responses; otherwise populate all four fields with substantive prose.
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
  voiceAndTone: z.object({
    adjectives: z.array(z.string()).length(3),
    inPractice: z.string(),
    communicationStrategy: z.string(),
    dosAndDonts: z.array(z.string()).min(3).max(4),
  }),
  primaryArchetype: z.object({ name: z.string(), description: z.string() }),
  secondaryArchetypes: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).max(2),
  aesthetic: z.object({
    summary: z.string(),
    palette: z.string(),
    materials: z.string(),
    style: z.string(),
  }).nullable(),
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
