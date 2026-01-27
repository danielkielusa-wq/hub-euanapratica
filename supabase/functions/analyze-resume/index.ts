import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const userId = claims.user.id;

    // ========== SMART GATEKEEPER: Check subscription and quota ==========
    
    // 1. Get user's subscription and plan details
    const { data: subData } = await supabase
      .from("user_subscriptions")
      .select("plan_id, plans(monthly_limit, features)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    // Default to basic plan if no subscription
    const planId = subData?.plan_id || "basic";
    // Handle the nested plans object which could be an array or single object
    const plansData = subData?.plans;
    const planObj = Array.isArray(plansData) ? plansData[0] : plansData;
    const plan = planObj as { monthly_limit: number; features: Record<string, boolean> } | null || { 
      monthly_limit: 1, 
      features: {} 
    };
    const features = plan.features || {};

    // 2. Count usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: usageCount, error: countError } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("app_id", "curriculo_usa")
      .gte("created_at", startOfMonth.toISOString());

    if (countError) {
      console.error("Error counting usage:", countError);
    }

    const currentUsage = usageCount || 0;

    // 3. Check if quota exceeded
    if (currentUsage >= plan.monthly_limit) {
      return new Response(
        JSON.stringify({
          error_code: "LIMIT_REACHED",
          error: "Limite mensal atingido",
          error_message: `Você atingiu o limite de ${plan.monthly_limit} análise(s) do seu plano este mês.`,
          plan_id: planId,
          monthly_limit: plan.monthly_limit,
          used: currentUsage,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== END GATEKEEPER ==========

    const { filePath, jobDescription } = await req.json();

    if (!filePath || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "filePath and jobDescription are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for unsupported legacy .doc format (binary, not XML-based)
    const lowerPath = filePath.toLowerCase();
    const isLegacyDoc = lowerPath.endsWith(".doc") && !lowerPath.endsWith(".docx");
    
    if (isLegacyDoc) {
      return new Response(
        JSON.stringify({
          error_code: "UNSUPPORTED_FORMAT",
          error: "Formato não suportado",
          error_message: "Arquivos .doc (formato legado) não são suportados. Por favor, converta seu currículo para PDF ou DOCX e tente novamente.",
          parsing_error: true,
        }),
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

    let systemPrompt = configData.value;

    // ========== FEATURE STRIPPING: Modify prompt based on plan features ==========
    if (!features.show_improvements) {
      systemPrompt += "\n\nIMPORTANT RESTRICTION: The user's plan does not include improvements. Return an EMPTY array [] for the 'improvements' field.";
    }
    if (!features.show_power_verbs) {
      systemPrompt += "\n\nIMPORTANT RESTRICTION: The user's plan does not include power verbs. Return an EMPTY array [] for the 'power_verbs_suggestions' field.";
    }
    if (!features.show_cheat_sheet) {
      systemPrompt += "\n\nIMPORTANT RESTRICTION: The user's plan does not include interview preparation. Return an EMPTY array [] for the 'interview_cheat_sheet' field.";
    }
    // ========== END FEATURE STRIPPING ==========

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

    // Extract text content based on file type
    const arrayBuffer = await fileData.arrayBuffer();
    const isPdf = lowerPath.endsWith(".pdf");
    const isDocx = lowerPath.endsWith(".docx");
    
    let resumeContent: string;
    let pdfBase64: string = "";
    
    if (isPdf) {
      // For PDF, convert to base64 for multimodal processing
      // Use chunked encoding to avoid stack overflow on large files
      const uint8Array = new Uint8Array(arrayBuffer);
      const chunkSize = 8192;
      let binaryString = "";
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      pdfBase64 = btoa(binaryString);
      resumeContent = `[PDF Resume - Base64 encoded for analysis]`;
    } else if (isDocx) {
      // For DOCX, extract text content from the XML
      const uint8Array = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder("utf-8");
      
      // DOCX is a ZIP file - we need to extract document.xml
      // For simplicity, we'll try to find readable text patterns
      const rawContent = textDecoder.decode(uint8Array);
      
      // Extract text between XML tags (simplified extraction)
      const textMatches = rawContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      const extractedText = textMatches
        .map(match => match.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!extractedText || extractedText.length < 50) {
        // Fallback: try to extract any readable text
        const cleanText = rawContent
          .replace(/<[^>]+>/g, ' ')
          .replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        resumeContent = cleanText.slice(0, 15000);
      } else {
        resumeContent = extractedText.slice(0, 15000);
      }
      
      // Validate content quality
      if (resumeContent.length < 100) {
        return new Response(
          JSON.stringify({
            error_code: "EXTRACTION_FAILED",
            error: "Falha na extração de texto",
            error_message: "Não foi possível extrair texto legível do seu currículo. Por favor, salve como PDF e tente novamente.",
            parsing_error: true,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          error_code: "UNSUPPORTED_FORMAT",
          error: "Formato não suportado",
          error_message: "Formato de arquivo não suportado. Por favor, envie um arquivo PDF ou DOCX.",
          parsing_error: true,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI Gateway with gemini-2.5-pro for complex structured output
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
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: isPdf 
              ? [
                  {
                    type: "text",
                    text: `Aqui está o currículo do candidato e a descrição da vaga para análise.\n\nDESCRIÇÃO DA VAGA:\n${jobDescription}`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:application/pdf;base64,${pdfBase64}`,
                    },
                  },
                ]
              : `Aqui está o currículo do candidato e a descrição da vaga para análise.\n\nDESCRIÇÃO DA VAGA:\n${jobDescription}\n\nCONTEÚDO DO CURRÍCULO:\n${resumeContent}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_resume_full",
              description: "Return comprehensive resume analysis with score, metrics, cultural bridge, market value, improvements, and interview preparation",
              parameters: {
                type: "object",
                properties: {
                  header: {
                    type: "object",
                    description: "Score and main messaging",
                    properties: {
                      score: { type: "number", description: "Compatibility score 0-100" },
                      status_tag: { type: "string", description: "Status label like COMPATIBILIDADE DE MERCADO: ALTA" },
                      main_message: { type: "string", description: "Main message about the profile" },
                      sub_message: { type: "string", description: "Secondary message with percentile context" },
                    },
                    required: ["score", "status_tag", "main_message", "sub_message"],
                  },
                  metrics: {
                    type: "object",
                    description: "Four key resume metrics",
                    properties: {
                      ats_format: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          details_pt: { type: "string" },
                        },
                        required: ["score", "label", "details_pt"],
                      },
                      keywords: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          details_pt: { type: "string" },
                          matched_count: { type: "number" },
                          total_required: { type: "number" },
                        },
                        required: ["score", "label", "details_pt", "matched_count", "total_required"],
                      },
                      action_verbs: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          details_pt: { type: "string" },
                          count: { type: "number" },
                        },
                        required: ["score", "label", "details_pt", "count"],
                      },
                      brevity: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          details_pt: { type: "string" },
                          page_count: { type: "number" },
                          ideal_page_count: { type: "number" },
                        },
                        required: ["score", "label", "details_pt", "page_count", "ideal_page_count"],
                      },
                    },
                    required: ["ats_format", "keywords", "action_verbs", "brevity"],
                  },
                  cultural_bridge: {
                    type: "object",
                    description: "Brazil to US title translation",
                    properties: {
                      brazil_title: { type: "string", description: "Original Brazilian job title" },
                      us_equivalent: { type: "string", description: "US equivalent title" },
                      explanation: { type: "string", description: "Explanation in Portuguese" },
                    },
                    required: ["brazil_title", "us_equivalent", "explanation"],
                  },
                  market_value: {
                    type: "object",
                    description: "Salary range estimation",
                    properties: {
                      range: { type: "string", description: "Salary range like $85k - $110k/yr" },
                      context: { type: "string", description: "Context like +15% acima da média" },
                    },
                    required: ["range", "context"],
                  },
                  power_verbs_suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-8 suggested power verbs in English",
                  },
                  improvements: {
                    type: "array",
                    description: "3-5 bullet point improvements",
                    items: {
                      type: "object",
                      properties: {
                        tags: {
                          type: "array",
                          items: { type: "string" },
                          description: "Category tags like QUANTIFICAÇÃO, LIDERANÇA, POWER VERB",
                        },
                        original: { type: "string", description: "Original text from resume" },
                        improved: { type: "string", description: "Improved version in English following US standards" },
                        impact_label: { type: "string", description: "Impact type like IMPACTO, CLAREZA, CONTEXTO" },
                      },
                      required: ["tags", "original", "improved", "impact_label"],
                    },
                  },
                  linkedin_fix: {
                    type: "object",
                    description: "LinkedIn headline suggestion",
                    properties: {
                      headline: { type: "string", description: "Suggested LinkedIn headline in English" },
                      reasoning_pt: { type: "string", description: "Explanation in Portuguese" },
                    },
                    required: ["headline", "reasoning_pt"],
                  },
                  interview_cheat_sheet: {
                    type: "array",
                    description: "3-5 likely interview questions",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "Interview question in English" },
                        context_pt: { type: "string", description: "Context/tip in Portuguese" },
                      },
                      required: ["question", "context_pt"],
                    },
                  },
                  parsing_error: {
                    type: "boolean",
                    description: "Set to true if the resume content could not be properly read or is corrupted",
                  },
                  parsing_error_message: {
                    type: "string",
                    description: "Error message in Portuguese if parsing_error is true",
                  },
                },
                required: [
                  "header",
                  "metrics",
                  "cultural_bridge",
                  "market_value",
                  "power_verbs_suggestions",
                  "improvements",
                  "linkedin_fix",
                  "interview_cheat_sheet",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_resume_full" } },
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
    if (!toolCall || toolCall.function.name !== "analyze_resume_full") {
      console.error("Unexpected AI response format:", aiData);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    // ========== RECORD USAGE: Log successful analysis ==========
    const { error: logError } = await supabase.from("usage_logs").insert({
      user_id: userId,
      app_id: "curriculo_usa",
    });

    if (logError) {
      console.error("Error logging usage:", logError);
      // Don't fail the request, just log the error
    }
    // ========== END RECORD USAGE ==========

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
