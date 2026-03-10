-- =============================================
-- Seed Email Automations (10 automations, all disabled initially)
-- =============================================

INSERT INTO public.email_automations (name, description, trigger_type, trigger_event, trigger_cron, trigger_condition, is_drip, drip_steps, template_name, enabled)
VALUES
-- 1. Drip Pos-Diagnostico (event: report.completed)
(
  'Drip Pós-Diagnóstico',
  'Sequência de nurturing após lead completar o diagnóstico. D0=resultado, D3=dicas, D7=plano de ação, D14=oferta',
  'event', 'report.completed', NULL, '{}'::JSONB,
  true,
  '[{"step":0,"delay_days":0,"template_name":"drip_report_d0"},{"step":1,"delay_days":3,"template_name":"drip_report_d3"},{"step":2,"delay_days":7,"template_name":"drip_report_d7"},{"step":3,"delay_days":14,"template_name":"drip_report_d14"}]'::JSONB,
  NULL, false
),

-- 2. Leads Quentes sem Conversao (cron: daily)
(
  'Leads Quentes sem Conversão',
  'Leads com temperatura quente/muito-quente há 48h+ sem assinatura ativa',
  'cron', NULL, 'daily',
  '{"lead_temperature":["quente","muito-quente"],"min_age_hours":48,"no_subscription":true}'::JSONB,
  false, '[]'::JSONB,
  'lead_hot_no_conversion', false
),

-- 3. Upgrade Nudge (inline: credits.exhausted)
(
  'Upgrade Nudge',
  'Email quando usuário esgota créditos mensais — incentiva upgrade de plano',
  'inline', 'credits.exhausted', NULL, '{}'::JSONB,
  false, '[]'::JSONB,
  'upgrade_nudge_credits', false
),

-- 4. Assinante Inativo (cron: weekly)
(
  'Assinante Inativo',
  'Assinante ativo pagando mas sem usar a plataforma em 14+ dias',
  'cron', NULL, 'weekly',
  '{"min_inactive_days":14,"subscription_status":"active"}'::JSONB,
  false, '[]'::JSONB,
  'subscriber_inactive', false
),

-- 5. Onboarding Assinante (event: subscription.activated)
(
  'Onboarding de Assinante',
  'Sequência de onboarding pós-ativação. D1=boas-vindas, D3=primeira feature, D7=comunidade',
  'event', 'subscription.activated', NULL, '{}'::JSONB,
  true,
  '[{"step":0,"delay_days":1,"template_name":"onboarding_sub_d1"},{"step":1,"delay_days":3,"template_name":"onboarding_sub_d3"},{"step":2,"delay_days":7,"template_name":"onboarding_sub_d7"}]'::JSONB,
  NULL, false
),

-- 6. Lembrete de Renovacao (cron: daily)
(
  'Lembrete de Renovação',
  'Lembrete 7 dias antes da renovação da assinatura',
  'cron', NULL, 'daily',
  '{"days_before_billing":7}'::JSONB,
  false, '[]'::JSONB,
  'subscription_renewal_reminder', false
),

-- 7. Win-back (cron: daily)
(
  'Win-back 30 dias',
  'Recuperação de ex-assinantes 30 dias após cancelamento',
  'cron', NULL, 'daily',
  '{"days_since_cancelled":30}'::JSONB,
  false, '[]'::JSONB,
  'winback_30d', false
),

-- 8. Reengajamento Lead Frio (cron: weekly)
(
  'Reengajamento Lead Frio',
  'Leads com relatório há 30+ dias sem email recente',
  'cron', NULL, 'weekly',
  '{"min_report_age_days":30,"no_recent_email_days":30}'::JSONB,
  false, '[]'::JSONB,
  'lead_cold_reengagement', false
),

-- 9. Follow-up Pos-Consultoria (cron: daily)
(
  'Follow-up Pós-Consultoria',
  'Acompanhamento 24h após sessão concluída para quem não tem assinatura',
  'cron', NULL, 'daily',
  '{"booking_completed_hours_ago":24,"no_subscription":true}'::JSONB,
  false, '[]'::JSONB,
  'followup_post_booking', false
),

-- 10. Milestone de Uso (inline: usage.milestone)
(
  'Milestone de Uso',
  'Celebração quando usuário atinge marcos de uso (5, 10, 25)',
  'inline', 'usage.milestone', NULL,
  '{"milestones":[5,10,25]}'::JSONB,
  false, '[]'::JSONB,
  'usage_milestone', false
)

ON CONFLICT DO NOTHING;
