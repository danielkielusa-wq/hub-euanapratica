import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  keywords: {
    found: string[];
    missing: string[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getUser(token);
    if (authError || !claims?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { filePath, jobDescription } = await req.json();

    if (!filePath || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "filePath and jobDescription are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI prompt from app_configs
    const { data: configData, error: configError } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "resume_analyzer_prompt")
      .single();

    if (configError) {
      console.error("Error fetching AI prompt config:", configError);
      return new Response(
        JSON.stringify({ error: "Failed to load AI configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = configData.value;

    // Download the resume file
    const { data: fileData, error: fileError } = await supabase.storage
      .from("temp-resumes")
      .download(filePath);

    if (fileError) {
      console.error("Error downloading file:", fileError);
      return new Response(
        JSON.stringify({ error: "Failed to read resume file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = filePath.endsWith(".pdf") 
      ? "application/pdf" 
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Aqui está o currículo do candidato e a descrição da vaga para análise.\n\nDESCRIÇÃO DA VAGA:\n${jobDescription}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_resume",
              description: "Return structured resume analysis with score, strengths, improvements and keywords",
              parameters: {
                type: "object",
                properties: {
                  score: {
                    type: "number",
                    description: "Compatibility score from 0 to 100",
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of the analysis in 2-3 sentences",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 3-5 strengths that match the job",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of 3-5 improvements to increase compatibility",
                  },
                  keywords: {
                    type: "object",
                    properties: {
                      found: {
                        type: "array",
                        items: { type: "string" },
                        description: "Keywords from job description found in resume",
                      },
                      missing: {
                        type: "array",
                        items: { type: "string" },
                        description: "Important keywords from job description missing in resume",
                      },
                    },
                    required: ["found", "missing"],
                  },
                },
                required: ["score", "summary", "strengths", "improvements", "keywords"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_resume" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    
    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_resume") {
      console.error("Unexpected AI response format:", aiData);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: AnalysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-resume error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
