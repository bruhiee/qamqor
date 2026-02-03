import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a content moderator for a health forum. Analyze the following content and determine:
1. Is it safe? (no dangerous medical advice, no harmful content)
2. Is it appropriate? (on-topic, respectful)
3. Does it require urgent medical attention? (emergency symptoms mentioned)

Respond in JSON format:
{
  "is_safe": boolean,
  "is_appropriate": boolean,
  "is_urgent": boolean,
  "flags": ["list of specific concerns if any"],
  "recommendation": "approve" | "flag" | "urgent_referral"
}

Language: ${language}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Moderate this content: ${content}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI moderation failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let moderation;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      moderation = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        is_safe: true,
        is_appropriate: true,
        is_urgent: false,
        flags: [],
        recommendation: "approve"
      };
    } catch {
      moderation = {
        is_safe: true,
        is_appropriate: true,
        is_urgent: false,
        flags: [],
        recommendation: "approve"
      };
    }

    return new Response(JSON.stringify(moderation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
