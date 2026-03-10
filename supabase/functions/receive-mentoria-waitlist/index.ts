/**
 * Receive Mentoria Waitlist Webhook
 *
 * Receives leads from LP → N8N webhook, stores in waitlist_mentoriarota,
 * enriches with career_evaluations data, and dispatches mentoria.interest
 * event back to N8N for downstream automations.
 *
 * Auth: x-internal-secret header (N8N sends this)
 *
 * Input:  { name, email, whatsapp, utm_source?, utm_medium?, utm_campaign?, referrer? }
 * Output: { success, waitlist_id, is_new, enrichment }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, validateInternalCall } from "../_shared/authGuard.ts";
import { normalizePhone } from "../_shared/whatsappService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    // 1. Auth — validate internal secret
    if (!validateInternalCall(req)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: jsonHeaders }
      );
    }

    // 2. Parse body
    const body = await req.json();
    const { name, email, whatsapp, utm_source, utm_medium, utm_campaign, referrer } = body;

    // 3. Validate required fields
    if (!name || !email || !whatsapp) {
      return new Response(
        JSON.stringify({ error: "name, email, and whatsapp are required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // 4. Normalize phone
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(whatsapp);
    } catch {
      normalizedPhone = whatsapp.replace(/\D/g, "");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 5. Check if lead already exists in waitlist
    const { data: existing } = await supabase
      .from("waitlist_mentoriarota")
      .select("id, status")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    let waitlistId: string;

    if (existing) {
      // Update — refresh contact info and UTM, but preserve status
      waitlistId = existing.id;
      await supabase
        .from("waitlist_mentoriarota")
        .update({
          name: name.trim(),
          whatsapp: normalizedPhone,
          ...(utm_source && { utm_source }),
          ...(utm_medium && { utm_medium }),
          ...(utm_campaign && { utm_campaign }),
          ...(referrer && { referrer }),
        })
        .eq("id", existing.id);
    } else {
      // Insert new waitlist entry
      const { data: inserted, error: insertError } = await supabase
        .from("waitlist_mentoriarota")
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: normalizedPhone,
          status: "waiting",
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          referrer: referrer || null,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save to waitlist", detail: insertError.message }),
          { status: 500, headers: jsonHeaders }
        );
      }

      waitlistId = inserted.id;

      // Send confirmation email only on first signup
      try {
        await sendTemplatedEmail({
          templateName: "confirmacao_interesse_mentoria",
          to: email.trim().toLowerCase(),
          variables: {
            "{{leadName}}": name.trim(),
            "{{hubLink}}": "https://hub.euanapratica.com",
          },
        });
      } catch (emailErr) {
        console.error("Confirmation email failed:", emailErr);
      }
    }

    // 6. Enrich — look up career_evaluations by email
    let enrichment: Record<string, unknown> | null = null;

    const { data: evaluation } = await supabase
      .from("career_evaluations")
      .select("id, fit_score, lead_temperature, recommended_product_name, processing_status, readiness_score, lead_priority_score")
      .eq("email", email.trim().toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // is_new = person not previously known in the system (no career_evaluation)
    const isNewToSystem = !evaluation;

    if (evaluation) {
      enrichment = {
        has_report: evaluation.processing_status === "completed",
        evaluation_id: evaluation.id,
        fit_score: evaluation.fit_score,
        readiness_score: evaluation.readiness_score,
        lead_temperature: evaluation.lead_temperature,
        lead_priority_score: evaluation.lead_priority_score,
        recommended_product: evaluation.recommended_product_name,
        report_status: evaluation.processing_status,
      };
    }

    // 7. Auto-create follow-up task for known leads
    if (evaluation) {
      try {
        await supabase.from("lead_tasks").insert({
          lead_id: evaluation.id,
          title: "Interessado em Mentoria em Grupo",
          description: `${name.trim()} (${email.trim().toLowerCase()}) se cadastrou na lista de espera da mentoria em grupo via LP.`,
          type: "follow_up",
          priority: "high",
          source: "n8n_automation",
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch (taskErr) {
        console.error("Auto task creation failed:", taskErr);
      }
    }

    // 8. Dispatch N8N webhook (fire-and-forget, but await in Deno)
    await dispatchN8NWebhook("mentoria.interest", {
      waitlist_id: waitlistId,
      is_new: isNewToSystem,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: normalizedPhone,
      utm_source: utm_source || null,
      utm_campaign: utm_campaign || null,
      enrichment,
    }, supabase);

    // 8. Return response
    return new Response(
      JSON.stringify({
        success: true,
        waitlist_id: waitlistId,
        is_new: isNewToSystem,
        enrichment,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("receive-mentoria-waitlist error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
