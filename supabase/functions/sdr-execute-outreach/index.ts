import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAdmin, requireAuthOrInternal } from "../_shared/authGuard.ts";
import { callLLM } from "../_shared/llmService.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

const FORM_LINK = "https://euanapratica.com/avaliar";
const MAX_OUTREACHES_PER_RUN = 50;
const BRT_OFFSET = -3; // UTC-3

function isBrazilBusinessHours(): boolean {
  const now = new Date();
  const brtHour = (now.getUTCHours() + 24 + BRT_OFFSET) % 24;
  return brtHour >= 9 && brtHour < 18;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, prospect_id, campaign_id, outreach_log_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Manual mode: admin sends a specific message
    if (mode === "manual") {
      const authResult = await requireAdmin(req);
      if (!authResult.authenticated) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!outreach_log_id) {
        return new Response(
          JSON.stringify({ error: "outreach_log_id required for manual mode" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await sendOutreachMessage(supabase, outreach_log_id);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cron mode: process all due outreaches
    if (mode === "cron") {
      const authResult = await requireAuthOrInternal(req);
      if (!authResult.authenticated) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!isBrazilBusinessHours()) {
        return new Response(
          JSON.stringify({ success: true, message: "Outside business hours (9-18h BRT)", processed: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await processCronOutreach(supabase);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start sequence: add qualified prospects to a campaign
    if (mode === "start_sequence") {
      const authResult = await requireAdmin(req);
      if (!authResult.authenticated) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!campaign_id) {
        return new Response(
          JSON.stringify({ error: "campaign_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await startSequence(supabase, campaign_id, prospect_id);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid mode. Use: manual, cron, or start_sequence" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Send a specific outreach message (by outreach_log_id)
 */
async function sendOutreachMessage(
  supabase: ReturnType<typeof createClient>,
  outreachLogId: string
): Promise<{ success: boolean; status: string; error?: string }> {
  const { data: log, error } = await supabase
    .from("sdr_outreach_logs")
    .select("*, sdr_prospects(*)")
    .eq("id", outreachLogId)
    .single();

  if (error || !log) {
    return { success: false, status: "error", error: "Outreach log not found" };
  }

  if (log.status !== "pending") {
    return { success: false, status: log.status, error: `Already ${log.status}` };
  }

  const prospect = log.sdr_prospects;

  try {
    if (log.channel === "email") {
      if (!prospect.email) {
        await supabase
          .from("sdr_outreach_logs")
          .update({ status: "failed", error_message: "No email address" })
          .eq("id", outreachLogId);
        return { success: false, status: "failed", error: "No email address" };
      }

      // Send via Resend (direct, not via email_templates since these are AI-generated)
      const { getApiConfig } = await import("../_shared/apiConfigService.ts");
      const resendConfig = await getApiConfig("resend_email");

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendConfig.credentials.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Daniel Kielusa <daniel@euanapratica.com>",
          to: [prospect.email],
          subject: log.subject || "Diagnóstico de Carreira Internacional",
          text: log.message_body,
        }),
      });

      if (!emailResponse.ok) {
        const errBody = await emailResponse.text();
        throw new Error(`Resend error ${emailResponse.status}: ${errBody}`);
      }
    } else if (log.channel === "whatsapp") {
      if (!prospect.phone) {
        await supabase
          .from("sdr_outreach_logs")
          .update({ status: "failed", error_message: "No phone number" })
          .eq("id", outreachLogId);
        return { success: false, status: "failed", error: "No phone number" };
      }

      // Dispatch via N8N → Evolution API / ManyChat
      await dispatchN8NWebhook("sdr.send_whatsapp", {
        phone: prospect.phone,
        message: log.message_body,
        prospect_id: prospect.id,
        prospect_name: prospect.name,
      }, supabase);
    } else if (log.channel === "linkedin") {
      // Dispatch via N8N → Phantombuster or manual
      await dispatchN8NWebhook("sdr.send_linkedin", {
        linkedin_url: prospect.linkedin_url,
        message: log.message_body,
        prospect_id: prospect.id,
        prospect_name: prospect.name,
      }, supabase);
    }

    // Update status
    const now = new Date().toISOString();
    await supabase
      .from("sdr_outreach_logs")
      .update({ status: "sent", sent_at: now })
      .eq("id", outreachLogId);

    await supabase
      .from("sdr_prospects")
      .update({ last_contacted_at: now })
      .eq("id", prospect.id);

    // Update campaign stats
    if (log.campaign_id) {
      await supabase.rpc("increment_sdr_campaign_stat", {
        p_campaign_id: log.campaign_id,
        p_field: "total_sent",
      }).catch(() => {
        // Fall back to manual increment
        supabase
          .from("sdr_campaigns")
          .select("total_sent")
          .eq("id", log.campaign_id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from("sdr_campaigns")
                .update({ total_sent: (data.total_sent || 0) + 1 })
                .eq("id", log.campaign_id)
                .then(() => {});
            }
          });
      });
    }

    return { success: true, status: "sent" };
  } catch (sendError) {
    await supabase
      .from("sdr_outreach_logs")
      .update({
        status: "failed",
        error_message: sendError instanceof Error ? sendError.message : String(sendError),
      })
      .eq("id", outreachLogId);

    return { success: false, status: "failed", error: String(sendError) };
  }
}

/**
 * Process cron: find prospects due for next outreach step, generate + send
 */
async function processCronOutreach(
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; processed: number; errors: number }> {
  const now = new Date().toISOString();

  // Find prospects in_sequence whose next_outreach_at has passed
  const { data: dueProspects, error } = await supabase
    .from("sdr_prospects")
    .select("*, sdr_campaigns(*)")
    .eq("outreach_status", "in_sequence")
    .lte("next_outreach_at", now)
    .limit(MAX_OUTREACHES_PER_RUN);

  if (error || !dueProspects?.length) {
    return { success: true, processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const prospect of dueProspects) {
    const campaign = prospect.sdr_campaigns;
    if (!campaign || campaign.status !== "active") continue;

    // CRM bridge: skip prospects who already converted (filled the form)
    if (prospect.email || prospect.phone) {
      const { data: crmCheck } = await supabase.rpc("check_sdr_prospect_in_crm", {
        p_email: prospect.email || null,
        p_phone: prospect.phone || null,
      });
      if (crmCheck?.length > 0 && crmCheck[0].exists_in_crm) {
        await supabase
          .from("sdr_prospects")
          .update({
            outreach_status: "converted",
            converted_evaluation_id: crmCheck[0].evaluation_id,
          })
          .eq("id", prospect.id);
        continue;
      }
    }

    const sequence = (campaign.sequence as Array<{
      step: number;
      channel: string;
      delay_hours: number;
      template_key: string;
    }>) || [];

    const nextStep = sequence.find((s) => s.step === prospect.current_step + 1);

    if (!nextStep) {
      // End of sequence — no more steps
      await supabase
        .from("sdr_prospects")
        .update({ outreach_status: "disqualified", next_outreach_at: null })
        .eq("id", prospect.id);
      continue;
    }

    try {
      // Fetch template
      const { data: template } = await supabase
        .from("sdr_message_templates")
        .select("*")
        .eq("template_key", nextStep.template_key)
        .eq("is_active", true)
        .single();

      if (!template) {
        errors++;
        continue;
      }

      const firstName = prospect.name.split(" ")[0];
      const formLink = `${FORM_LINK}?utm_source=sdr&utm_medium=${nextStep.channel}&utm_campaign=${campaign.name}`;

      // Generate personalized message via LLM
      const profileContext = [
        `Nome: ${prospect.name} (${firstName})`,
        prospect.headline && `Cargo: ${prospect.headline}`,
        prospect.company && `Empresa: ${prospect.company}`,
        prospect.location && `Local: ${prospect.location}`,
        prospect.bio && `Bio: ${prospect.bio}`,
        prospect.ai_qualification?.pain_points?.length && `Pain points: ${prospect.ai_qualification.pain_points.join(", ")}`,
        prospect.ai_qualification?.message_angle && `Ângulo: ${prospect.ai_qualification.message_angle}`,
      ].filter(Boolean).join("\n");

      const systemPrompt = `Você é Daniel Kielusa, especialista em carreira internacional. Personalize esta mensagem de outreach.

TEMPLATE: ${template.body_template}
INSTRUÇÕES: ${template.ai_instructions || "Personalize naturalmente."}
PERSONA: ${campaign.ai_persona || "professional"}

Regras:
- {{formLink}} = ${formLink}
- {{firstName}} = ${firstName}
- Responda em JSON: { "subject": "..." (null se não email), "body": "...", "personalization_score": 1-10 }`;

      const llmResult = await callLLM({
        apiKey: "openai_api",
        systemPrompt,
        userMessage: profileContext,
        jsonMode: true,
        maxTokens: 1000,
        edgeFunction: "sdr-execute-outreach",
        metadata: { prospect_id: prospect.id, step: nextStep.step },
      });

      const generated = JSON.parse(llmResult.content);

      let subject = generated.subject;
      if (nextStep.channel === "email" && !subject && template.subject_template) {
        subject = template.subject_template.replace(/\{\{firstName\}\}/g, firstName);
      }

      // Insert outreach log
      const { data: logEntry } = await supabase
        .from("sdr_outreach_logs")
        .insert({
          prospect_id: prospect.id,
          campaign_id: campaign.id,
          step_number: nextStep.step,
          channel: nextStep.channel,
          subject,
          message_body: generated.body,
          ai_generation_metadata: {
            model: llmResult.model,
            tokens: (llmResult.inputTokens || 0) + (llmResult.outputTokens || 0),
            duration_ms: llmResult.durationMs,
            personalization_score: generated.personalization_score,
            template_key: nextStep.template_key,
          },
          status: "pending",
        })
        .select("id")
        .single();

      if (logEntry) {
        // Send the message
        const sendResult = await sendOutreachMessage(supabase, logEntry.id);

        if (sendResult.success) {
          // Advance step and calculate next outreach time
          const nextNextStep = sequence.find((s) => s.step === nextStep.step + 1);
          const nextOutreachAt = nextNextStep
            ? new Date(Date.now() + nextNextStep.delay_hours * 3600 * 1000).toISOString()
            : null;

          await supabase
            .from("sdr_prospects")
            .update({
              current_step: nextStep.step,
              next_outreach_at: nextOutreachAt,
              outreach_status: nextNextStep ? "in_sequence" : "disqualified",
            })
            .eq("id", prospect.id);

          processed++;
        } else {
          errors++;
        }
      }
    } catch (stepError) {
      errors++;
    }
  }

  return { success: true, processed, errors };
}

/**
 * Start sequence: move qualified prospects into a campaign
 */
async function startSequence(
  supabase: ReturnType<typeof createClient>,
  campaignId: string,
  specificProspectId?: string
): Promise<{ success: boolean; enrolled: number }> {
  // Fetch campaign
  const { data: campaign, error: campError } = await supabase
    .from("sdr_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campError || !campaign) {
    return { success: false, enrolled: 0 };
  }

  const sequence = (campaign.sequence as Array<{
    step: number;
    delay_hours: number;
  }>) || [];

  if (sequence.length === 0) {
    return { success: false, enrolled: 0 };
  }

  // First step delay
  const firstStepDelay = sequence[0]?.delay_hours || 0;
  const nextOutreachAt = new Date(Date.now() + firstStepDelay * 3600 * 1000).toISOString();

  // Build query for prospects to enroll
  let query = supabase
    .from("sdr_prospects")
    .update({
      campaign_id: campaignId,
      outreach_status: "in_sequence",
      current_step: 0,
      next_outreach_at: nextOutreachAt,
    })
    .eq("outreach_status", "qualified");

  if (specificProspectId) {
    query = query.eq("id", specificProspectId);
  }

  const { data, error } = await query.select("id");
  const enrolled = data?.length || 0;

  // Update campaign stats and status
  await supabase
    .from("sdr_campaigns")
    .update({
      status: "active",
      started_at: campaign.started_at || new Date().toISOString(),
      total_prospects: (campaign.total_prospects || 0) + enrolled,
    })
    .eq("id", campaignId);

  return { success: true, enrolled };
}
