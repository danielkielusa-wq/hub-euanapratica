-- Seed app_configs keys for the suggest-whatsapp-messages Edge Function.
-- Same pattern as suggest_tasks_api_config / suggest_tasks_prompt.

INSERT INTO public.app_configs (key, value, description)
VALUES
  (
    'suggest_whatsapp_api_config',
    'anthropic_api',
    'API provider usado para sugerir mensagens WhatsApp via IA (ex: anthropic_api, openai_api). Configure a API em /admin/configuracoes-apis.'
  ),
  (
    'suggest_whatsapp_prompt',
    '',
    'System prompt customizado para a funcionalidade "Sugerir WhatsApp" no detalhe do lead. Deixe vazio para usar o prompt padrão embutido na Edge Function.'
  )
ON CONFLICT (key) DO NOTHING;
