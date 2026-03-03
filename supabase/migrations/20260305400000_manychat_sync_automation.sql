-- ============================================================================
-- Register ManyChat sync automation for report.generated events
-- Covers BOTH paths: external lead form AND hub user assessment
-- ============================================================================

INSERT INTO public.n8n_automations (
  name,
  display_name,
  description,
  trigger_event,
  webhook_url,
  category,
  enabled,
  metadata
) VALUES (
  'manychat_report_sync',
  'Sync ManyChat — Relatório Gerado',
  'Quando qualquer relatório é concluído (lead externo OU usuário do hub), '
  'cria/atualiza contato no ManyChat com dados do report: score, temperatura, '
  'fase ROTA, produto recomendado e link do relatório. '
  'Garante que 100% dos leads/usuários estejam no ManyChat para campanhas.',
  'report.generated',
  'https://n8n.euanapratica.com/webhook/manychat-report-sync',
  'lead',
  true,
  jsonb_build_object(
    'integration', 'manychat',
    'manychat_fields_used', jsonb_build_array(
      'rep_area', 'rep_atuacao', 'rep_english_level', 'rep_experience',
      'rep_objetivo', 'rep_visa_status', 'rep_family_status',
      'rep_income', 'rep_investment_range', 'rep_impediment', 'rep_concern',
      'email_lead', 'link_report', 'WPP_ID',
      'rep_score', 'rep_temperature', 'rep_phase', 'rep_product'
    ),
    'covers_paths', jsonb_build_array('external_lead_form', 'hub_user_assessment'),
    'idempotent', true
  )
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  webhook_url = EXCLUDED.webhook_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  updated_at = now();
