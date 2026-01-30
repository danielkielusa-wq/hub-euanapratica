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
    const { evaluationId } = await req.json();

    if (!evaluationId) {
      return new Response(
        JSON.stringify({ error: "evaluationId obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch evaluation
    const { data: evaluation, error: fetchError } = await supabase
      .from("career_evaluations")
      .select("*")
      .eq("id", evaluationId)
      .single();

    if (fetchError || !evaluation) {
      return new Response(
        JSON.stringify({ error: "Avaliação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already formatted
    if (evaluation.formatted_report) {
      return new Response(
        JSON.stringify({ content: evaluation.formatted_report }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get formatter prompt from config
    const { data: config } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "lead_report_formatter_prompt")
      .single();

    const systemPrompt = config?.value || "Formate o relatório de diagnóstico de carreira de forma profissional.";

    // Build user context
    const userContext = `
DADOS DO LEAD:
- Nome: ${evaluation.name}
- Email: ${evaluation.email}
- Área: ${evaluation.area || 'Não informado'}
- Atuação: ${evaluation.atuacao || 'Não informado'}
- Trabalha Internacionalmente: ${evaluation.trabalha_internacional ? 'Sim' : 'Não'}
- Experiência: ${evaluation.experiencia || 'Não informado'}
- Nível de Inglês: ${evaluation.english_level || 'Não informado'}
- Objetivo: ${evaluation.objetivo || 'Não informado'}
- Status do Visto: ${evaluation.visa_status || 'Não informado'}
- Timeline: ${evaluation.timeline || 'Não informado'}
- Status Familiar: ${evaluation.family_status || 'Não informado'}
- Faixa de Renda: ${evaluation.income_range || 'Não informado'}
- Faixa de Investimento: ${evaluation.investment_range || 'Não informado'}
- Impedimento: ${evaluation.impediment || 'Nenhum'}
- Outro Impedimento: ${evaluation.impediment_other || 'Nenhum'}
- Principal Preocupação: ${evaluation.main_concern || 'Não informado'}

CONTEÚDO DO RELATÓRIO ORIGINAL:
${evaluation.report_content}
`;

    // Call Lovable AI
    if (!lovableApiKey) {
      // Return raw content if no AI key
      return new Response(
        JSON.stringify({ content: evaluation.report_content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI Error:", await aiResponse.text());
      return new Response(
        JSON.stringify({ content: evaluation.report_content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const formattedContent = aiData.choices?.[0]?.message?.content || evaluation.report_content;

    // Convert markdown to HTML (simple conversion)
    const htmlContent = formattedContent
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)\n(?=<li)/g, '$1')
      .replace(/(<li.*<\/li>)(?!\n<li)/g, '<ul class="list-disc space-y-1 my-3">$1</ul>')
      .replace(/\n\n/g, '</p><p class="my-3">')
      .replace(/\n/g, '<br/>');

    // Cache the formatted report
    await supabase
      .from("career_evaluations")
      .update({
        formatted_report: htmlContent,
        formatted_at: new Date().toISOString()
      })
      .eq("id", evaluationId);

    return new Response(
      JSON.stringify({ content: htmlContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
