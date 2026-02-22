import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/authGuard.ts";

// Columns returned to the client (CRIT-5: never return PII or internal fields)
const PUBLIC_EVALUATION_COLUMNS = [
  "id",
  "name",
  "email",
  "area",
  "atuacao",
  "experiencia",
  "english_level",
  "objetivo",
  "visa_status",
  "timeline",
  "family_status",
  "formatted_report",
  "processing_status",
  "recommendation_status",
  "recommended_product_name",
  "recommendation_description",
  "recommendation_landing_page_url",
  "formatted_at",
  "created_at",
  "updated_at",
].join(", ");

// Rate limiting: max attempts per token (CRIT-4)
const MAX_VERIFY_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email, action } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, message: "Token obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if token exists
    if (action === "check") {
      const { data: evaluation, error } = await supabase
        .from("career_evaluations")
        .select("id")
        .eq("access_token", token)
        .maybeSingle();

      if (error || !evaluation) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify email matches
    if (action === "verify") {
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, message: "Email obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // CRIT-4: Rate limiting — check failed attempts for this token
      const { data: recentAttempts } = await supabase
        .from("analytics_events")
        .select("id")
        .eq("event_type", "report_verify_failed")
        .eq("metadata->>token_hash", token.slice(0, 8))
        .gte("created_at", new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString());

      if (recentAttempts && recentAttempts.length >= MAX_VERIFY_ATTEMPTS) {
        return new Response(
          JSON.stringify({ success: false, message: "Muitas tentativas. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // CRIT-5: Only select columns needed for verification + email check
      const { data: evaluation, error } = await supabase
        .from("career_evaluations")
        .select("id, email, user_id, access_count, first_accessed_at, access_token_expires_at")
        .eq("access_token", token)
        .maybeSingle();

      if (error || !evaluation) {
        // Generic error message (MED-6: don't leak whether token exists)
        return new Response(
          JSON.stringify({ success: false, message: "Verificação falhou. Confira o email e tente novamente." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LOW-2: Check token expiration
      if (evaluation.access_token_expires_at && new Date(evaluation.access_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, message: "Link expirado. Entre em contato para solicitar um novo relatório." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check email match (case-insensitive)
      if (evaluation.email.toLowerCase() !== email.toLowerCase()) {
        // Log failed attempt for rate limiting (CRIT-4)
        await supabase
          .from("analytics_events")
          .insert({
            user_id: evaluation.user_id,
            event_type: "report_verify_failed",
            entity_type: "career_evaluation",
            entity_id: evaluation.id,
            metadata: {
              token_hash: token.slice(0, 8),
              source: "public_report",
            }
          }).catch(() => {}); // fire-and-forget

        // Generic error message (MED-6: same message for not found and wrong email)
        return new Response(
          JSON.stringify({ success: false, message: "Verificação falhou. Confira o email e tente novamente." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // MED-11: Atomic access_count increment via RPC-style update
      const newAccessCount = (evaluation.access_count || 0) + 1;
      const updateData: Record<string, unknown> = {
        access_count: newAccessCount,
      };

      if (!evaluation.first_accessed_at) {
        updateData.first_accessed_at = new Date().toISOString();
      }

      await supabase
        .from("career_evaluations")
        .update(updateData)
        .eq("id", evaluation.id);

      // Log analytics event (report opened) — MED-7: no token in metadata
      await supabase
        .from("analytics_events")
        .insert({
          user_id: evaluation.user_id,
          event_type: "report_opened",
          entity_type: "career_evaluation",
          entity_id: evaluation.id,
          metadata: {
            source: "public_report",
            access_count: newAccessCount,
          }
        });

      await supabase
        .from("audit_events")
        .insert({
          user_id: evaluation.user_id,
          actor_id: evaluation.user_id,
          action: "usage_recorded",
          source: "report",
          new_values: {
            event_type: "report_opened",
            entity_type: "career_evaluation",
            entity_id: evaluation.id,
            access_count: newAccessCount,
          }
        });

      // CRIT-5: Return only public columns for the latest evaluation
      const { data: latestEvaluation } = await supabase
        .from("career_evaluations")
        .select(PUBLIC_EVALUATION_COLUMNS)
        .eq("email", evaluation.email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, evaluation: latestEvaluation }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    // MED-6: Generic error message, never expose internals
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
