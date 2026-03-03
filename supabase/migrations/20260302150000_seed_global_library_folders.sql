-- Seed: Global Library root folders
-- Idempotent: only inserts if no root folders exist yet

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.library_folders WHERE parent_id IS NULL) THEN
    INSERT INTO public.library_folders (name, icon, description, access_level, display_order, parent_id)
    VALUES
      ('Diagnóstico e Planejamento',  '🎯', 'Como interpretar seu relatório, fases da jornada e checklists por etapa.',          'public',     1, NULL),
      ('Currículo Internacional',     '📄', 'Templates ATS-friendly por área, guia de formatação americana e exemplos.',          'restricted', 2, NULL),
      ('LinkedIn e Presença Digital', '💼', 'Otimização do perfil, templates de headline e scripts de conexão.',                  'restricted', 3, NULL),
      ('Inglês Profissional',         '🗣️', 'Vocabulário técnico por área, templates de e-mail e glossário de entrevistas.',     'restricted', 4, NULL),
      ('Entrevistas',                 '🤝', 'Método STAR, perguntas frequentes e scripts de negociação salarial.',                'restricted', 5, NULL),
      ('Mercado de Trabalho EUA',     '🌎', 'Expectativas salariais por área/estado, cultura corporativa e onde buscar vagas.',   'restricted', 6, NULL),
      ('Visto e Documentação',        '🛂', 'Guia por tipo de visto (H1B, O-1, EB-2, TN), timeline e checklist de documentos.',  'restricted', 7, NULL),
      ('Templates e Ferramentas',     '🧰', 'Planilhas de acompanhamento, calculadoras salariais e roteiros de networking.',      'restricted', 8, NULL);
  END IF;
END $$;
