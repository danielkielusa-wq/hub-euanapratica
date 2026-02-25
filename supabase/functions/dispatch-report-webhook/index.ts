import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthOrInternal, getCorsHeaders } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const { evaluation_id, lead_name, lead_email, lead_phone, access_token } = await req.json();
    if (!evaluation_id) {
      return new Response(JSON.stringify({ error: "evaluation_id required" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch full formatted_report to extract qualification fields
    const { data: ev } = await supabase
      .from("career_evaluations")
      .select("id, name, email, phone, access_token, formatted_report")
      .eq("id", evaluation_id)
      .maybeSingle();

    if (!ev) {
      return new Response(JSON.stringify({ error: "Evaluation not found" }), { status: 404, headers: corsHeaders });
    }

    let report: Record<string, any> = {};
    try { report = JSON.parse(ev.formatted_report || "{}"); } catch { /* ignore */ }

    // Normalize temperature — LLM sometimes returns non-standard values
    const rawTemp = (report.lead_qualification?.lead_temperature ?? "").toString().toLowerCase().replace(/_/g, "-");
    const TEMP_MAP: Record<string, string> = {
      "frio": "frio", "cold": "frio",
      "morno": "morno", "warm": "morno",
      "quente": "quente", "hot": "quente",
      "muito-quente": "muito-quente", "very-hot": "muito-quente",
      "super-quente": "muito-quente", "super-hot": "muito-quente",
    };
    const normalizedTemp = TEMP_MAP[rawTemp]
      ?? (rawTemp.includes("super") || rawTemp.includes("muito") ? "muito-quente"
        : rawTemp.includes("quente") || rawTemp.includes("hot") ? "quente"
        : rawTemp || null);

    const reportLink = ev.access_token
      ? `https://hub.euanapratica.com/report/${ev.access_token}`
      : null;

    await dispatchN8NWebhook("report.generated", {
      lead_id:             ev.id,
      lead_name:           ev.name ?? lead_name,
      lead_email:          ev.email ?? lead_email,
      lead_phone:          ev.phone ?? lead_phone ?? null,
      access_token:        ev.access_token ?? access_token,
      report_link:         reportLink,
      readiness_score:     report.scoring?.readiness_score ?? null,
      lead_temperature:    normalizedTemp,
      lead_priority_score: report.lead_qualification?.lead_priority_score ?? null,
      phase_id:            report.phase_classification?.phase_id ?? null,
      phase_name:          report.phase_classification?.phase_name ?? null,
      is_tech_professional: report.lead_qualification?.is_tech_professional ?? false,
      is_senior_level:     report.lead_qualification?.is_senior_level ?? false,
      is_high_income:      report.lead_qualification?.is_high_income ?? false,
      primary_product:     report.product_recommendation?.primary_offer?.recommended_product_name ?? null,
      barriers:            report.barriers_analysis?.critical_blockers || [],
    }, supabase);

    console.log(`[dispatch-report-webhook] Dispatched for ${ev.email} (${evaluation_id})`);
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    console.error("[dispatch-report-webhook] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
