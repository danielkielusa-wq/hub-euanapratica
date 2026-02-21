/**
 * Send Subscription Email
 *
 * Handles all subscription-related transactional emails:
 * - confirmation: New subscription activated
 * - renewal_reminder: 3 days before billing
 * - payment_failure: Dunning notification
 * - cancellation: Cancellation confirmed
 *
 * Called internally by webhook handlers or admin triggers.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { requireAuthOrInternal, corsHeaders } from "../_shared/authGuard.ts";

type EmailType = "confirmation" | "renewal_reminder" | "payment_failure" | "cancellation";

interface EmailRequest {
  type: EmailType;
  user_id: string;
}

const EMAIL_TEMPLATES: Record<EmailType, {
  subject: string;
  buildHtml: (data: { name: string; planName: string; expiresAt?: string; changeCardUrl?: string }) => string;
}> = {
  confirmation: {
    subject: "Assinatura ativada com sucesso!",
    buildHtml: ({ name, planName }) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Bem-vindo ao ${planName}!</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Olá ${name},<br><br>
          Sua assinatura do plano <strong>${planName}</strong> foi ativada com sucesso.
          Você já tem acesso a todos os benefícios do seu plano.
        </p>
        <a href="https://hub.euanapratica.com/dashboard/hub"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Acessar Meu Hub
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 30px;">
          Equipe EUA na Prática
        </p>
      </div>
    `,
  },
  renewal_reminder: {
    subject: "Sua assinatura será renovada em breve",
    buildHtml: ({ name, planName, expiresAt }) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Lembrete de Renovação</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Olá ${name},<br><br>
          Sua assinatura do plano <strong>${planName}</strong> será renovada automaticamente
          ${expiresAt ? `em <strong>${expiresAt}</strong>` : 'em breve'}.
        </p>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Se desejar fazer alguma alteração, acesse sua conta antes da data de renovação.
        </p>
        <a href="https://hub.euanapratica.com/dashboard/assinatura"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Gerenciar Assinatura
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 30px;">
          Equipe EUA na Prática
        </p>
      </div>
    `,
  },
  payment_failure: {
    subject: "Problema com seu pagamento",
    buildHtml: ({ name, planName, changeCardUrl }) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #dc2626; font-size: 24px;">Problema com Pagamento</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Olá ${name},<br><br>
          Houve um problema ao processar o pagamento da sua assinatura do plano <strong>${planName}</strong>.
          Para evitar a suspensão do seu acesso, atualize seus dados de pagamento.
        </p>
        ${changeCardUrl ? `
        <a href="${changeCardUrl}"
           style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Atualizar Cartão
        </a>
        ` : ''}
        <p style="color: #888; font-size: 13px; margin-top: 30px;">
          Se precisar de ajuda, entre em contato pelo suporte.<br>
          Equipe EUA na Prática
        </p>
      </div>
    `,
  },
  cancellation: {
    subject: "Cancelamento confirmado",
    buildHtml: ({ name, planName, expiresAt }) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1a1a1a; font-size: 24px;">Cancelamento Confirmado</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Olá ${name},<br><br>
          Confirmamos o cancelamento da sua assinatura do plano <strong>${planName}</strong>.
          ${expiresAt ? `Você manterá acesso até <strong>${expiresAt}</strong>.` : ''}
        </p>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
          Se mudar de ideia, você pode reativar sua assinatura a qualquer momento.
        </p>
        <a href="https://hub.euanapratica.com/pricing"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Reativar Assinatura
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 30px;">
          Sentiremos sua falta!<br>
          Equipe EUA na Prática
        </p>
      </div>
    `,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireAuthOrInternal(req);
  if (authError) return authError;

  try {
    const { type, user_id }: EmailRequest = await req.json();

    if (!type || !user_id || !EMAIL_TEMPLATES[type]) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Required: type, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .maybeSingle();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "User not found or no email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch subscription data
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("plan_id, expires_at, ticto_change_card_url, next_billing_date")
      .eq("user_id", user_id)
      .maybeSingle();

    // Get plan name
    let planName = "Básico";
    if (sub?.plan_id) {
      const { data: plan } = await supabase
        .from("plans")
        .select("name")
        .eq("id", sub.plan_id)
        .maybeSingle();
      planName = plan?.name || sub.plan_id;
    }

    // Format dates
    const expiresAt = sub?.expires_at
      ? new Date(sub.expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : undefined;

    // Get Resend API key
    let resendApiKey: string | null = null;
    try {
      const resendConfig = await getApiConfig("resend_email");
      resendApiKey = resendConfig.credentials.api_key;
    } catch {
      console.warn("Resend not configured");
    }

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured — email will not be sent");
      return new Response(
        JSON.stringify({ success: true, emailSent: false, message: "Email not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = EMAIL_TEMPLATES[type];
    const html = template.buildHtml({
      name: profile.full_name || "Aluno(a)",
      planName,
      expiresAt,
      changeCardUrl: sub?.ticto_change_card_url || undefined,
    });

    // Send via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EUA na Prática <noreply@euanapratica.com>",
        to: [profile.email],
        subject: template.subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      console.error("Resend error:", errorBody);
      return new Response(
        JSON.stringify({ success: false, error: "Email send failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Subscription email sent:", { type, userId: user_id, to: profile.email });

    return new Response(
      JSON.stringify({ success: true, emailSent: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
