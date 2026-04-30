// Edge function: analyze-brand-survey
// Fetches all responses for a survey and asks Lovable AI Gateway for a structured brand summary.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a senior Brand Strategist. You will receive a JSON array of stakeholder responses to a brand discovery survey. Each response contains an arbitrary set of answers about the brand's attributes, voice, tone, audience, and differentiators.

Your job: synthesize the OVERLAPPING themes (not just one person's opinion) into a structured strategic summary. Be specific, decisive, and use language a creative team can act on. Avoid generic adjectives.

You MUST call the "submit_brand_summary" tool with your synthesis.`;

const tools = [
  {
    type: "function",
    function: {
      name: "submit_brand_summary",
      description:
        "Submit the synthesized brand strategy summary based on all stakeholder responses.",
      parameters: {
        type: "object",
        properties: {
          core_values: {
            type: "array",
            items: { type: "string" },
            description: "3-6 core values that emerged across responses.",
          },
          brand_voice_attributes: {
            type: "array",
            items: { type: "string" },
            description:
              "3-6 voice/tone attributes (e.g. 'confident but warm', 'plain-spoken', 'witty').",
          },
          target_audience_insights: {
            type: "array",
            items: { type: "string" },
            description:
              "Specific insights about who the brand is for and what they care about.",
          },
          key_differentiators: {
            type: "array",
            items: { type: "string" },
            description:
              "What makes this brand distinct from competitors, based on overlapping stakeholder views.",
          },
          summary_narrative: {
            type: "string",
            description:
              "A 2-4 sentence executive narrative tying everything together.",
          },
        },
        required: [
          "core_values",
          "brand_voice_attributes",
          "target_audience_insights",
          "key_differentiators",
          "summary_narrative",
        ],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { survey_id } = await req.json();
    if (!survey_id || typeof survey_id !== "string") {
      return new Response(JSON.stringify({ error: "survey_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Verify caller is authenticated (agency user)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: survey, error: surveyErr } = await admin
      .from("branding_surveys")
      .select("id, title")
      .eq("id", survey_id)
      .single();
    if (surveyErr || !survey) throw new Error("Survey not found");

    const { data: responses, error: respErr } = await admin
      .from("survey_responses")
      .select("respondent_name, respondent_role, answers, created_at")
      .eq("survey_id", survey_id);
    if (respErr) throw respErr;

    if (!responses || responses.length === 0) {
      return new Response(
        JSON.stringify({ error: "No responses to analyze yet." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userPayload = `Survey title: ${survey.title}\nResponse count: ${responses.length}\n\nStakeholder responses (JSON):\n${JSON.stringify(responses, null, 2)}`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPayload },
          ],
          tools,
          tool_choice: {
            type: "function",
            function: { name: "submit_brand_summary" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in workspace settings.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return a structured summary");
    }
    const summary = JSON.parse(toolCall.function.arguments);

    const { data: saved, error: saveErr } = await admin
      .from("brand_summaries")
      .insert({
        survey_id,
        summary,
        response_count: responses.length,
      })
      .select()
      .single();
    if (saveErr) throw saveErr;

    return new Response(JSON.stringify({ summary, record: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-brand-survey error", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
