import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, language = "en", userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const languageInstructions = {
      en: "Write in English.",
      ru: "Напишите на русском языке.",
      kk: "Қазақ тілінде жазыңыз."
    };

    const systemPrompt = `You are a medical health education content writer. Generate an educational health article about the given topic.

IMPORTANT RULES:
- DO NOT provide medical diagnosis or treatment advice
- Focus on general health education and awareness
- Include verified, evidence-based information only
- Always recommend consulting healthcare professionals
- Use appropriate language for general audience

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en}

Generate the article in this JSON format:
{
  "title": "Article title",
  "summary": "2-3 sentence summary",
  "content": "Full article content with paragraphs (markdown supported)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Category name"
}`;

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
          { role: "user", content: `Write an educational health article about: ${topic}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required for AI services." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Article generation failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let article;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      article = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      article = null;
    }

    if (!article) {
      throw new Error("Failed to parse article content");
    }

    // Save to database if Supabase is configured
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const titleField = language === 'ru' ? 'title_ru' : language === 'kk' ? 'title_kk' : 'title_en';
      const contentField = language === 'ru' ? 'content_ru' : language === 'kk' ? 'content_kk' : 'content_en';
      const summaryField = language === 'ru' ? 'summary_ru' : language === 'kk' ? 'summary_kk' : 'summary_en';

      const { error: dbError } = await supabase.from('health_articles').insert({
        author_id: userId || null,
        [titleField]: article.title,
        title_en: language === 'en' ? article.title : '',
        [contentField]: article.content,
        content_en: language === 'en' ? article.content : '',
        [summaryField]: article.summary,
        summary_en: language === 'en' ? article.summary : '',
        tags: article.tags,
        category: article.category,
        is_ai_generated: true,
        needs_review: true,
        is_published: false,
      });

      if (dbError) {
        console.error("Database error:", dbError);
      }
    }

    return new Response(JSON.stringify({ article }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Article generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
