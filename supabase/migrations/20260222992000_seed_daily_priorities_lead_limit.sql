INSERT INTO public.app_configs (key, value, description)
VALUES ('daily_priorities_lead_limit', '80', 'Quantidade maxima de leads incluidos na analise diaria de prioridades (10-500)')
ON CONFLICT (key) DO NOTHING;
