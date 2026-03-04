import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAdmin } from "../_shared/authGuard.ts";
import { callLLM } from "../_shared/llmService.ts";

const FORM_LINK = "https://euanapratica.com/avaliar";

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

    const { prospect_id, template_key, campaign_id } = await req.json();

    if (!prospect_id || !template_key) {
      return new Response(
        JSON.stringify({ error: "prospect_id and template_key required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch prospect, template, and campaign in parallel
    const [prospectRes, templateRes, campaignRes] = await Promise.all([
      supabase.from("sdr_prospects").select("*").eq("id", prospect_id).single(),
      supabase.from("sdr_message_templates").select("*").eq("template_key", template_key).eq("is_active", true).single(),
      campaign_id
        ? supabase.from("sdr_campaigns").select("*").eq("id", campaign_id).single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (prospectRes.error || !prospectRes.data) {
      return new Response(
        JSON.stringify({ error: "Prospect not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (templateRes.error || !templateRes.data) {
      return new Response(
        JSON.stringify({ error: `Template '${template_key}' not found or inactive` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prospect = prospectRes.data;
    const template = templateRes.data;
    const campaign = campaignRes.data;
    const firstName = prospect.name.split(" ")[0];

    // Build UTM-tracked form link
    const formLink = `${FORM_LINK}?utm_source=sdr&utm_medium=${template.channel}&utm_campaign=${campaign?.name || "direct"}`;

    // Build personalization context
    const profileContext = [
      `Nome completo: ${prospect.name}`,
      `Primeiro nome: ${firstName}`,
      prospect.headline && `Cargo: ${prospect.headline}`,
      prospect.company && `Empresa: ${prospect.company}`,
      prospect.location && `Local: ${prospect.location}`,
      prospect.bio && `Bio: ${prospect.bio}`,
      prospect.skills?.length && `Skills: ${prospect.skills.join(", ")}`,
      prospect.experience_years && `Experiência: ${prospect.experience_years} anos`,
      prospect.english_level && `Inglês: ${prospect.english_level}`,
    ].filter(Boolean).join("\n");

    const qualificationContext = prospect.ai_qualification
      ? `\n\nQualificação AI:\n- Score: ${prospect.ai_score}/100\n- Temperatura: ${prospect.ai_temperature}\n- Pain points: ${prospect.ai_qualification.pain_points?.join(", ") || "N/A"}\n- Ângulo recomendado: ${prospect.ai_qualification.message_angle || "N/A"}`
      : "";

    const systemPrompt = `Você é Daniel Kielusa, especialista em carreira internacional para brasileiros. Você está escrevendo uma mensagem de outreach personalizada.

TEMPLATE BASE:
${template.body_template}

INSTRUÇÕES DO TEMPLATE:
${template.ai_instructions || "Siga o template e personalize com os dados do prospect."}

${campaign?.ai_context ? `CONTEXTO DA CAMPANHA:\n${campaign.ai_context}\n` : ""}
PERSONA: ${campaign?.ai_persona || "professional"}

REGRAS:
- Substitua todos os {{placeholders}} com conteúdo personalizado
- {{formLink}} deve ser exatamente: ${formLink}
- {{firstName}} deve ser: ${firstName}
- Mantenha o tom e extensão indicados nas instruções
- NÃO invente informações que não estejam no perfil
- Responda em JSON: { "subject": "..." (null se não for email), "body": "...", "personalization_score": 1-10 }`;

    const llmResult = await callLLM({
      apiKey: "openai_api",
      systemPrompt,
      userMessage: `Perfil do prospect:\n${profileContext}${qualificationContext}`,
      jsonMode: true,
      maxTokens: 1500,
      userId: authResult.userId,
      edgeFunction: "sdr-generate-message",
      metadata: { prospect_id, template_key, campaign_id },
    });

    const generated = JSON.parse(llmResult.content);

    // Also generate subject from template if email and not provided by LLM
    let subject = generated.subject;
    if (template.channel === "email" && !subject && template.subject_template) {
      subject = template.subject_template.replace(/\{\{firstName\}\}/g, firstName);
    }

    // Insert outreach log as pending
    const { data: logEntry, error: logError } = await supabase
      .from("sdr_outreach_logs")
      .insert({
        prospect_id,
        campaign_id: campaign_id || null,
        step_number: prospect.current_step + 1,
        channel: template.channel,
        subject,
        message_body: generated.body,
        ai_generation_metadata: {
          model: llmResult.model,
          tokens: (llmResult.inputTokens || 0) + (llmResult.outputTokens || 0),
          duration_ms: llmResult.durationMs,
          personalization_score: generated.personalization_score,
          template_key,
        },
        status: "pending",
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        outreach_log_id: logEntry?.id,
        channel: template.channel,
        subject,
        body: generated.body,
        personalization_score: generated.personalization_score,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
