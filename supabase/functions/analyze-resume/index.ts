import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlobReader, BlobWriter, ZipReader } from "https://deno.land/x/zipjs@v2.7.52/index.js";

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

    // User client for reading data with user's permissions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin client for reliable usage recording (bypasses RLS)
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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
      // DOCX is a ZIP archive - properly unzip it using zip.js
      try {
        const blob = new Blob([arrayBuffer]);
        const zipReader = new ZipReader(new BlobReader(blob));
        const entries = await zipReader.getEntries();
        
        // Find word/document.xml (main content)
        const documentEntry = entries.find((e: { filename: string }) => e.filename === "word/document.xml");
        
        if (!documentEntry || !documentEntry.getData) {
          await zipReader.close();
          return new Response(
            JSON.stringify({
              error_code: "EXTRACTION_FAILED",
              error: "Arquivo corrompido",
              error_message: "O arquivo DOCX parece estar corrompido. Por favor, abra no Word, salve novamente e tente.",
              parsing_error: true,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Extract document.xml content
        const documentBlob = await documentEntry.getData(new BlobWriter());
        const documentXml = await documentBlob.text();
        await zipReader.close();
        
        // Extract text from <w:t> tags
        const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
        const extractedText = textMatches
          .map((match: string) => match.replace(/<[^>]+>/g, ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (extractedText.length < 100) {
          return new Response(
            JSON.stringify({
              error_code: "INSUFFICIENT_CONTENT",
              error: "Conteúdo insuficiente",
              error_message: "O currículo contém muito pouco texto. Certifique-se de que o arquivo não está vazio ou protegido.",
              parsing_error: true,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        resumeContent = extractedText.slice(0, 15000);
        
      } catch (zipError) {
        console.error("DOCX extraction error:", zipError);
        return new Response(
          JSON.stringify({
            error_code: "EXTRACTION_FAILED",
            error: "Falha na extração",
            error_message: "Não foi possível ler o arquivo DOCX. Por favor, converta para PDF e tente novamente.",
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

    // Call OpenAI Responses API with structured outputs
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseSchema = {
      name: "resume_analysis",
      strict: true,
      schema: {
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
            additionalProperties: false,
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
                additionalProperties: false,
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
                additionalProperties: false,
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
                additionalProperties: false,
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
                additionalProperties: false,
              },
            },
            required: ["ats_format", "keywords", "action_verbs", "brevity"],
            additionalProperties: false,
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
            additionalProperties: false,
          },
          market_value: {
            type: "object",
            description: "Salary range estimation",
            properties: {
              range: { type: "string", description: "Salary range like $85k - $110k/yr" },
              context: { type: "string", description: "Context like +15% acima da media" },
            },
            required: ["range", "context"],
            additionalProperties: false,
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
                  description: "Category tags like QUANTIFICACAO, LIDERANCA, POWER VERB",
                },
                original: { type: "string", description: "Original text from resume" },
                improved: { type: "string", description: "Improved version in English following US standards" },
                impact_label: { type: "string", description: "Impact type like IMPACTO, CLAREZA, CONTEXTO" },
              },
              required: ["tags", "original", "improved", "impact_label"],
              additionalProperties: false,
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
            additionalProperties: false,
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
              additionalProperties: false,
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
          "parsing_error",
          "parsing_error_message",
        ],
        additionalProperties: false,
      },
    };

    const userContent = isPdf
      ? [
          {
            type: "input_text",
            text:
              `Aqui esta o curriculo do candidato e a descricao da vaga para analise.

DESCRICAO DA VAGA:
${jobDescription}`,
          },
          {
            type: "input_file",
            file_data: pdfBase64,
            filename: "resume.pdf",
          },
        ]
      : [
          {
            type: "input_text",
            text:
              `Aqui esta o curriculo do candidato e a descricao da vaga para analise.

DESCRICAO DA VAGA:
${jobDescription}

CONTEUDO DO CURRICULO:
${resumeContent}`,
          },
        ];

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: systemPrompt,
        input: [
          {
            role: "user",
            content: userContent,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: responseSchema.name,
            schema: responseSchema.schema,
            strict: responseSchema.strict,
          },
        },
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
      console.error("OpenAI error:", aiResponse.status, errorText.slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("OpenAI response id:", aiData?.id || "unknown");

    const extractOutputText = (data: any): string | null => {
      if (typeof data?.output_text === "string") {
        return data.output_text;
      }
      const items = Array.isArray(data?.output) ? data.output : [];
      for (const item of items) {
        if (item?.type === "message" && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part?.type === "output_text" && typeof part.text === "string") {
              return part.text;
            }
          }
        }
      }
      return null;
    };

    const outputText = extractOutputText(aiData);
    if (!outputText) {
      console.error("Unexpected OpenAI response format:", aiData);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any;
    try {
      result = JSON.parse(outputText);
    } catch (parseError) {
      console.error("Failed to parse JSON output:", parseError, outputText.slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // ========== RECORD USAGE: Reliable recording with retry logic ==========
    // CRITICAL: Usage MUST be recorded BEFORE returning the result
    // If recording fails after retries, the request fails to prevent abuse
    
    const recordUsageWithRetry = async (uid: string, maxRetries = 3): Promise<boolean> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { error } = await adminSupabase
            .from('usage_logs')
            .insert({ user_id: uid, app_id: 'curriculo_usa' });
          
          if (!error) {
            console.log(`Usage recorded successfully for user ${uid} on attempt ${attempt + 1}`);
            return true;
          }
          
          console.error(`Usage recording attempt ${attempt + 1} failed:`, error);
        } catch (err) {
          console.error(`Usage recording attempt ${attempt + 1} threw:`, err);
        }
        
        // Exponential backoff: 200ms, 400ms, 800ms
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
        }
      }
      return false;
    };

    const usageRecorded = await recordUsageWithRetry(userId);
    
    if (!usageRecorded) {
      console.error("CRITICAL: Failed to record usage after all retries for user:", userId);
      return new Response(
        JSON.stringify({
          error: 'Falha ao registrar uso. Por favor, tente novamente.',
          error_code: 'USAGE_RECORDING_FAILED',
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
