import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrAssistant, getCorsHeaders } from "../_shared/authGuard.ts";
import {
  normalizePhone,
  sendWhatsAppMessage,
  substituteVariables,
} from "../_shared/whatsappService.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // Admin or Assistant
    const authError = await requireAdminOrAssistant(req);
    if (authError) return authError;

    const { lead_id, message, template_name, variables } = await req.json();

    const jsonHeaders = { ...headers, "Content-Type": "application/json" };

    if (!lead_id) {
      return new Response(
        JSON.stringify({ success: false, error: "lead_id é obrigatório" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (!message && !template_name) {
      return new Response(
        JSON.stringify({ success: false, error: "Informe uma mensagem ou selecione um template" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Create admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from("career_evaluations")
      .select("id, name, email, phone, access_token")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ success: false, error: "Lead não encontrado" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (!lead.phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Lead não possui telefone cadastrado" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Read default country code from app_configs
    const { data: countryCodeRow } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", "whatsapp_default_country_code")
      .single();
    const defaultCountryCode = countryCodeRow?.value || "55";

    // Normalize phone (respects "+" prefix for international numbers)
    const phone = normalizePhone(lead.phone, defaultCountryCode);

    // Resolve message text
    let messageText: string;
    let usedTemplateName: string | undefined;

    if (template_name) {
      // Fetch template via RPC
      const { data: rows, error: tplError } = await supabase.rpc(
        "get_whatsapp_template_by_name",
        { p_template_name: template_name }
      );

      if (tplError || !rows || rows.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: `Template '${template_name}' não encontrado ou desativado` }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const template = rows[0];

      // Auto-fill known variables
      const reportLink = lead.access_token
        ? `https://hub.euanapratica.com/report/${lead.access_token}`
        : "";

      const defaultVars: Record<string, string> = {
        "{{leadName}}": lead.name || "Cliente",
        "{{reportLink}}": reportLink,
        "{{leadEmail}}": lead.email || "",
      };

      // Normalize user-provided variables to {{key}} format so they override defaults
      const normalizedUserVars: Record<string, string> = {};
      for (const [key, value] of Object.entries(variables || {})) {
        const wrappedKey = key.startsWith("{{") ? key : `{{${key}}}`;
        normalizedUserVars[wrappedKey] = String(value);
      }

      // Merge: user-provided variables override defaults
      const mergedVars = { ...defaultVars, ...normalizedUserVars };

      messageText = substituteVariables(template.body, mergedVars);
      usedTemplateName = template_name;
    } else {
      messageText = message!;
    }

    // Send via Evolution API
    const result = await sendWhatsAppMessage({
      phone,
      text: messageText,
      leadId: lead_id,
      templateName: usedTemplateName,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Get admin user ID from JWT
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    let adminUserId: string | null = null;
    if (token) {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user } } = await anonClient.auth.getUser();
      adminUserId = user?.id || null;
    }

    // Insert lead_interaction
    const { data: interaction } = await supabase
      .from("lead_interactions" as any)
      .insert({
        lead_id,
        type: "whatsapp_sent",
        content: messageText,
        direction: "outbound",
        channel: "whatsapp",
        created_by: adminUserId,
        metadata: {
          evolution_message_id: result.messageId,
          template_name: usedTemplateName || null,
          delivery_status: "sent",
        },
      } as any)
      .select("id")
      .single();

    console.log(`✅ WhatsApp sent to ${phone} for lead ${lead_id}. interaction_id: ${interaction?.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
        interactionId: interaction?.id,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("[send-whatsapp] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno ao enviar WhatsApp" }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
