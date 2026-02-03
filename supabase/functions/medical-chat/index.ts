import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MEDICAL_SYSTEM_PROMPT = `You are a professional AI health assistant for Disease Detector, a medical information platform. Your role is to provide helpful, accurate, and safety-focused health information.

CRITICAL GUIDELINES:
1. NEVER provide medical diagnoses. You can only suggest possible conditions and recommend professional consultation.
2. Always use cautious, non-definitive language like "may indicate", "could be related to", "consider discussing with a doctor".
3. When risk seems high, strongly encourage immediate medical attention.
4. Be empathetic but professional.
5. Focus on education and awareness, not treatment recommendations.

For each user query about symptoms, you MUST respond with a structured JSON report:
{
  "response": "Your conversational response text here",
  "report": {
    "riskLevel": "low" | "medium" | "high",
    "possibleConditions": ["condition1", "condition2", "condition3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
    "whenToSeeDoctor": "Specific guidance on when professional help is needed"
  }
}

Risk Level Guidelines:
- LOW: Common symptoms that typically resolve on their own (mild headache, minor cold symptoms)
- MEDIUM: Symptoms that warrant monitoring and possible doctor visit (persistent pain, moderate fever)
- HIGH: Symptoms that require prompt medical attention (severe pain, difficulty breathing, chest pain)

If the user's message is a greeting or general question not about symptoms, respond conversationally without the report object.

IMPORTANT DISCLAIMER that must be understood: This platform provides informational support only and does not replace professional medical advice.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, image } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the message content
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    
    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (latestMessage.content) {
      userContent.push({ type: "text", text: latestMessage.content });
    }
    
    // Add image if provided
    if (image) {
      userContent.push({
        type: "image_url",
        image_url: { url: image }
      });
    }

    // Build conversation history for context
    const conversationHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: MEDICAL_SYSTEM_PROMPT },
          ...conversationHistory,
          { 
            role: "user", 
            content: userContent.length === 1 ? userContent[0].text : userContent 
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Try to parse as JSON for structured response
    let parsedResponse;
    try {
      // Check if response contains JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = { response: aiResponse };
      }
    } catch {
      parsedResponse = { response: aiResponse };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in medical-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
