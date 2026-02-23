-- Seed app_configs keys for the suggest-lead-tasks Edge Function.
-- Follows the same pattern as daily_priorities_api_config / daily_priorities_prompt.

INSERT INTO public.app_configs (key, value, description)
VALUES
  (
    'suggest_tasks_api_config',
    'anthropic_api',
    'API provider usado para sugerir tarefas de leads via IA (ex: anthropic_api, openai_api). Configure a API em /admin/configuracoes-apis.'
  ),
  (
    'suggest_tasks_prompt',
    '',
    'System prompt customizado para a funcionalidade "Sugerir Tarefas" no detalhe do lead. Deixe vazio para usar o prompt padrão embutido na Edge Function. Disponível: {{lead_data}}, {{interactions}}, {{existing_tasks}}, {{today}}.'
  )
ON CONFLICT (key) DO NOTHING;
