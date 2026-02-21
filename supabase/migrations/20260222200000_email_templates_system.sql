-- ============================================================
-- EMAIL TEMPLATES SYSTEM - Centralized Email Template Management
-- ============================================================
-- Este sistema permite que administradores criem e editem templates
-- de email via interface admin com editor WYSIWYG (Unlayer)
-- ============================================================

-- Create email_templates table
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- Identificador único (ex: "booking_confirmation", "subscription_renewal")
    display_name TEXT NOT NULL, -- Nome amigável para exibição (ex: "Confirmação de Agendamento")
    subject TEXT NOT NULL, -- Assunto do email (suporta variáveis: "Olá {{firstName}}")
    body_html TEXT NOT NULL, -- HTML renderizado do Unlayer (pronto para envio)
    design_json JSONB, -- Design JSON do Unlayer (para reedição no editor)
    variables JSONB DEFAULT '[]'::JSONB, -- Array de variáveis: ["{{firstName}}", "{{bookingDate}}"]
    category TEXT, -- Categoria opcional: 'booking', 'subscription', 'espaco', 'system'
    description TEXT, -- Descrição interna sobre quando este template é usado
    enabled BOOLEAN DEFAULT true, -- Permite ativar/desativar sem deletar
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_email_templates_name ON public.email_templates(name);
CREATE INDEX idx_email_templates_enabled ON public.email_templates(enabled);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);

-- Enable Row Level Security
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Apenas admins podem acessar via UI
CREATE POLICY "Admins can read email templates"
ON public.email_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert email templates"
ON public.email_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email templates"
ON public.email_templates FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete email templates"
ON public.email_templates FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- EDGE FUNCTION RPC - Get Template by Name
-- ============================================================
-- Função RPC usada pelas edge functions para buscar templates
-- Bypassa RLS usando SECURITY DEFINER (service_role access)
CREATE OR REPLACE FUNCTION public.get_email_template_by_name(p_template_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subject TEXT,
  body_html TEXT,
  variables JSONB,
  enabled BOOLEAN
) AS $$
BEGIN
  -- Esta função só deve ser chamada pelas edge functions (service_role)
  -- Retorna apenas templates habilitados
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.subject,
    t.body_html,
    t.variables,
    t.enabled
  FROM public.email_templates t
  WHERE t.name = p_template_name
    AND t.enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_email_template_by_name(TEXT) TO service_role;

-- ============================================================
-- SEED INICIAL - Templates Existentes Migrados
-- ============================================================
-- Migra os templates existentes das edge functions para o banco

-- SUBSCRIPTION TEMPLATES
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'subscription_confirmation',
  'Assinatura - Confirmação',
  'Bem-vindo ao {{planName}}!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 Bem-vindo ao {{planName}}!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>{{name}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Sua assinatura do plano <strong>{{planName}}</strong> foi ativada com sucesso!
                Você já tem acesso a todos os benefícios do seu plano.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://hub.euanapratica.com/dashboard/hub" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Acessar Meu Hub
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © 2026 EUA Na Prática. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{name}}", "{{planName}}"]'::JSONB,
  'subscription',
  'Enviado quando uma nova assinatura é ativada'
),
(
  'subscription_renewal_reminder',
  'Assinatura - Lembrete de Renovação',
  'Sua assinatura será renovada em breve',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                📅 Lembrete de Renovação
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>{{name}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Sua assinatura do plano <strong>{{planName}}</strong> será renovada automaticamente em <strong>{{expiresAt}}</strong>.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://hub.euanapratica.com/dashboard/assinatura" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Gerenciar Assinatura
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © 2026 EUA Na Prática. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{name}}", "{{planName}}", "{{expiresAt}}"]'::JSONB,
  'subscription',
  'Enviado 3 dias antes da renovação automática'
),
(
  'subscription_payment_failure',
  'Assinatura - Falha no Pagamento',
  'Problema com seu pagamento',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ⚠️ Problema com Pagamento
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>{{name}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Houve um problema ao processar o pagamento da sua assinatura do plano <strong>{{planName}}</strong>.
                Para evitar a suspensão do seu acesso, por favor atualize seus dados de pagamento.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{changeCardUrl}}" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Atualizar Cartão
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © 2026 EUA Na Prática. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{name}}", "{{planName}}", "{{changeCardUrl}}"]'::JSONB,
  'subscription',
  'Enviado quando há falha no pagamento (dunning)'
),
(
  'subscription_cancellation',
  'Assinatura - Cancelamento',
  'Cancelamento confirmado',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #71717a, #52525b); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Cancelamento Confirmado
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>{{name}}</strong>,
              </p>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Confirmamos o cancelamento da sua assinatura do plano <strong>{{planName}}</strong>.
                Você manterá acesso até <strong>{{expiresAt}}</strong>.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://hub.euanapratica.com/pricing" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Reativar Assinatura
                </a>
              </div>
              <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 24px;">
                Sentiremos sua falta! 💙
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                © 2026 EUA Na Prática. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{name}}", "{{planName}}", "{{expiresAt}}"]'::JSONB,
  'subscription',
  'Enviado quando assinatura é cancelada'
)
ON CONFLICT (name) DO NOTHING;

-- BOOKING TEMPLATE (placeholder - será personalizado via admin UI)
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description) VALUES
(
  'booking_confirmation',
  'Agendamento - Confirmação',
  '✅ Agendamento Confirmado: {{serviceName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 48px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Agendamento Confirmado!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #52525b; font-size: 16px; margin: 0 0 20px;">
                Olá <strong>{{studentName}}</strong>, sua sessão de mentoria foi agendada com sucesso!
              </p>
              <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #166534; margin: 0 0 16px; font-size: 18px;">{{serviceName}}</h2>
                <p style="margin: 8px 0;">📅 Data: <strong>{{formattedDate}}</strong></p>
                <p style="margin: 8px 0;">⏰ Horário: <strong>{{formattedStartTime}} - {{formattedEndTime}}</strong></p>
                <p style="margin: 8px 0;">⏱️ Duração: <strong>{{durationMinutes}} minutos</strong></p>
                <p style="margin: 8px 0;">👤 Mentor: <strong>{{mentorName}}</strong></p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["{{studentName}}", "{{serviceName}}", "{{formattedDate}}", "{{formattedStartTime}}", "{{formattedEndTime}}", "{{durationMinutes}}", "{{mentorName}}"]'::JSONB,
  'booking',
  'Enviado quando um agendamento é confirmado'
)
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE public.email_templates IS 'Templates de email centralizados com editor WYSIWYG (Unlayer)';
COMMENT ON COLUMN public.email_templates.name IS 'Identificador único usado no código (ex: booking_confirmation)';
COMMENT ON COLUMN public.email_templates.display_name IS 'Nome amigável exibido na interface admin';
COMMENT ON COLUMN public.email_templates.body_html IS 'HTML final exportado do Unlayer - usado para envio de emails';
COMMENT ON COLUMN public.email_templates.design_json IS 'Design JSON do Unlayer - usado para reeditar no editor';
COMMENT ON COLUMN public.email_templates.variables IS 'Array de variáveis disponíveis: ["{{name}}", "{{date}}"]';
COMMENT ON COLUMN public.email_templates.enabled IS 'Permite desativar template sem deletar';
COMMENT ON FUNCTION public.get_email_template_by_name IS 'Busca template por nome para uso em edge functions (service_role)';
