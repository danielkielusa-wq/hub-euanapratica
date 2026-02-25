-- Migration: Add menu_visibility config to app_configs
-- This config controls which menu items are visible for students and mentors

INSERT INTO public.app_configs (key, value, description)
VALUES (
  'menu_visibility',
  '{
    "student": {
      "hub": true,
      "comunidade": true,
      "agendamentos": true,
      "catalogo": true,
      "cursos": true,
      "espacos": true,
      "dashboard": true,
      "biblioteca": true,
      "tarefas": true,
      "curriculo": true,
      "title_translator": true,
      "prime_jobs": true,
      "pricing": true,
      "assinatura": true,
      "perfil": true,
      "pedidos": true,
      "suporte": true
    },
    "mentor": {
      "dashboard": true,
      "espacos": true,
      "agendamentos": true,
      "disponibilidade": true,
      "agenda": true,
      "tarefas": true,
      "biblioteca": true,
      "upload_materiais": true,
      "perfil": true,
      "suporte": true
    }
  }',
  'Controla a visibilidade de itens no menu lateral para alunos e mentores'
)
ON CONFLICT (key) DO NOTHING;
