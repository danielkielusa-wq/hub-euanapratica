-- Seed app_configs for LLM parameters that are currently hardcoded in Edge Functions.
-- Each function can now read its max_tokens, timeout, and model from the DB.
-- Values match the current hardcoded defaults so there's no behavior change.

INSERT INTO public.app_configs (key, value, description) VALUES
  -- Anthropic API version (used in 6+ Edge Functions)
  ('anthropic_api_version', '2023-06-01', 'Versão da API Anthropic usada nos headers das chamadas LLM'),

  -- analyze-resume
  ('analyze_resume_max_tokens', '8000', 'Max tokens para análise de currículo'),
  ('analyze_resume_max_chars', '15000', 'Max caracteres extraídos do arquivo de currículo'),
  ('analyze_resume_timeout_ms', '120000', 'Timeout em ms para chamada LLM de análise de currículo'),

  -- format-lead-report
  ('format_report_max_tokens', '8000', 'Max tokens para geração de relatório de lead'),
  ('format_report_timeout_ms', '50000', 'Timeout em ms para chamada LLM de formatação de relatório'),

  -- generate-daily-priorities
  ('daily_priorities_max_tokens_min', '3000', 'Min tokens para prioridades diárias (escala com qtd de leads)'),
  ('daily_priorities_max_tokens_max', '8000', 'Max tokens para prioridades diárias'),
  ('daily_priorities_timeout_ms', '120000', 'Timeout em ms para chamada LLM de prioridades diárias'),

  -- recommend-product
  ('recommend_product_max_tokens', '1024', 'Max tokens para recomendação de produto'),
  ('recommend_product_timeout_ms', '50000', 'Timeout em ms para recomendação de produto'),

  -- suggest-lead-tasks
  ('suggest_tasks_max_tokens', '1500', 'Max tokens para sugestão de tarefas de lead'),

  -- suggest-whatsapp-messages
  ('suggest_whatsapp_max_tokens', '1200', 'Max tokens para sugestão de mensagens WhatsApp'),

  -- translate-title
  ('translate_title_max_tokens', '4000', 'Max tokens para tradução de títulos'),

  -- generate-weekly-report
  ('generate_weekly_report_max_tokens', '4000', 'Max tokens para relatório semanal'),
  ('generate_weekly_report_timeout_ms', '50000', 'Timeout em ms para relatório semanal'),

  -- content-studio
  ('content_studio_ideas_max_tokens', '8000', 'Max tokens para geração de ideias de conteúdo'),
  ('content_studio_ideas_timeout_ms', '120000', 'Timeout para ideias de conteúdo'),
  ('content_studio_insights_max_tokens', '8000', 'Max tokens para insights de conteúdo'),
  ('content_studio_insights_timeout_ms', '120000', 'Timeout para insights de conteúdo'),
  ('content_studio_script_max_tokens', '6000', 'Max tokens para geração de script (formato longo)'),
  ('content_studio_script_timeout_ms', '120000', 'Timeout para geração de script'),
  ('content_studio_posts_max_tokens', '3000', 'Max tokens para posts de redes sociais'),
  ('content_studio_posts_timeout_ms', '60000', 'Timeout para posts de redes sociais'),

  -- upsell confidence threshold
  ('upsell_confidence_threshold', '0.7', 'Threshold de confiança mínima para match de upsell (0-1)'),

  -- LLM generic defaults
  ('llm_default_max_tokens', '4000', 'Max tokens default para chamadas LLM genéricas via callLLM()')
ON CONFLICT (key) DO NOTHING;
