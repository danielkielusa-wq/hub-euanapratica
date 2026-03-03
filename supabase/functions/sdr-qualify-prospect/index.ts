import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";
import { callLLM } from "../_shared/llmService.ts";

const QUALIFICATION_SYSTEM_PROMPT = `Você é um especialista em qualificação de leads para um serviço de consultoria de carreira internacional para brasileiros.

Analise o perfil do prospect e determine:
1. Um score de 0-100 indicando a probabilidade de interesse no serviço
2. A "temperatura" do lead (frio/morno/quente/muito-quente)
3. Os pain points prováveis baseados no perfil
4. A melhor abordagem para contato
5. O ângulo de mensagem mais eficaz

Critérios de qualificação:
- Brasileiro ou lusófono (alta prioridade)
- Cargo em área que se beneficia de internacionalização (tech, finanças, engenharia, saúde, etc.)
- Experiência 3+ anos (indica estabilidade para investir em carreira)
- Indicadores de interesse: keywords como "internacional", "abroad", "relocation", "remote work"
- Location: Brasil (quer sair) ou recém-chegado em país novo (precisa de adaptação)

Score < 20: descartado (sem fit)
Score 20-49: frio (baixa probabilidade, nurture longo)
Score 50-69: morno (potencial médio)
Score 70-84: quente (alto interesse provável)
Score 85-100: muito-quente (fit perfeito)

Responda SEMPRE em JSON válido.`;

interface QualificationResult {
  score: number;
  temperature: "frio" | "morno" | "quente" | "muito-quente";
  pain_points: string[];
  recommended_approach: string;
  message_angle: string;
  reasoning: string;
  disqualify_reason?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAdmin(req);
    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prospect_id, prospect_ids } = await req.json();
    const ids: string[] = prospect_ids || (prospect_id ? [prospect_id] : []);

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "prospect_id or prospect_ids required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch prospects
    const { data: prospects, error: fetchError } = await supabase
      .from("sdr_prospects")
      .select("*")
      .in("id", ids);

    if (fetchError || !prospects?.length) {
      return new Response(
        JSON.stringify({ error: "Prospects not found", details: fetchError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ prospect_id: string; score: number; temperature: string; status: string }> = [];

    for (const prospect of prospects) {
      // Mark as qualifying
      await supabase
        .from("sdr_prospects")
        .update({ outreach_status: "qualifying" })
        .eq("id", prospect.id);

      const profileDescription = [
        prospect.name && `Nome: ${prospect.name}`,
        prospect.headline && `Cargo/Título: ${prospect.headline}`,
        prospect.company && `Empresa: ${prospect.company}`,
        prospect.location && `Localização: ${prospect.location}`,
        prospect.bio && `Bio: ${prospect.bio}`,
        prospect.skills?.length && `Skills: ${prospect.skills.join(", ")}`,
        prospect.experience_years && `Anos de experiência: ${prospect.experience_years}`,
        prospect.english_level && `Nível de inglês: ${prospect.english_level}`,
        prospect.linkedin_url && `LinkedIn: ${prospect.linkedin_url}`,
      ].filter(Boolean).join("\n");

      try {
        const llmResult = await callLLM({
          apiKey: "openai_api",
          systemPrompt: QUALIFICATION_SYSTEM_PROMPT,
          userMessage: `Qualifique este prospect:\n\n${profileDescription}`,
          jsonMode: true,
          maxTokens: 1000,
          userId: authResult.userId,
          edgeFunction: "sdr-qualify-prospect",
          metadata: { prospect_id: prospect.id },
        });

        const qualification: QualificationResult = JSON.parse(llmResult.content);

        const temperature = qualification.temperature || (
          qualification.score >= 85 ? "muito-quente" :
          qualification.score >= 70 ? "quente" :
          qualification.score >= 50 ? "morno" : "frio"
        );

        const newStatus = qualification.score < 20 ? "disqualified" : "qualified";

        await supabase
          .from("sdr_prospects")
          .update({
            ai_score: qualification.score,
            ai_temperature: temperature,
            ai_qualification: qualification,
            ai_qualified_at: new Date().toISOString(),
            outreach_status: newStatus,
          })
          .eq("id", prospect.id);

        results.push({
          prospect_id: prospect.id,
          score: qualification.score,
          temperature,
          status: newStatus,
        });
      } catch (llmError) {
        console.error(`LLM error for prospect ${prospect.id}:`, llmError);
        // Reset to new on error
        await supabase
          .from("sdr_prospects")
          .update({ outreach_status: "new" })
          .eq("id", prospect.id);

        results.push({
          prospect_id: prospect.id,
          score: 0,
          temperature: "frio",
          status: "error",
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
