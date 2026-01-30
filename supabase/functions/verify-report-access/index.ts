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

      const { data: evaluation, error } = await supabase
        .from("career_evaluations")
        .select("*")
        .eq("access_token", token)
        .maybeSingle();

      if (error || !evaluation) {
        return new Response(
          JSON.stringify({ success: false, message: "Relatório não encontrado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check email match (case-insensitive)
      if (evaluation.email.toLowerCase() !== email.toLowerCase()) {
        return new Response(
          JSON.stringify({ success: false, message: "Email não corresponde ao relatório" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update access tracking
      const updateData: Record<string, unknown> = {
        access_count: (evaluation.access_count || 0) + 1
      };
      
      if (!evaluation.first_accessed_at) {
        updateData.first_accessed_at = new Date().toISOString();
      }

      await supabase
        .from("career_evaluations")
        .update(updateData)
        .eq("id", evaluation.id);

      return new Response(
        JSON.stringify({ success: true, evaluation }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
