-- AI Mentor Configs: prompts for session prep, session summary, and student suggestions
-- All admin-editable via app_configs

INSERT INTO public.app_configs (key, value, description)
VALUES
  ('ai_session_prep_prompt',
   'Voce e um assistente de mentoria especializado em preparar briefings para sessoes. Com base nos dados fornecidos sobre o espaco, alunos e sessao, gere um briefing conciso para o mentor com:
1. Resumo do progresso da turma
2. Pontos de atencao (alunos com baixa participacao, tarefas atrasadas)
3. Sugestoes de topicos para abordar na sessao
4. Perguntas que o mentor pode fazer para engajar a turma

Responda em portugues brasileiro, de forma objetiva e pratica. Use formatacao Markdown.',
   'Prompt do sistema para geracao de briefing pre-sessao (AI Session Prep). Editavel pelo admin.'),

  ('ai_session_summary_prompt',
   'Voce e um assistente de mentoria. Com base nos dados da sessao realizada (presencas, duracao, notas do mentor), gere um resumo pos-sessao com:
1. Resumo da sessao (participacao, duracao)
2. Destaques e pontos positivos
3. Pontos de melhoria ou acompanhamento
4. Sugestoes de tarefas para enviar aos alunos
5. Proximos passos recomendados

Responda em portugues brasileiro, de forma objetiva. Use formatacao Markdown.',
   'Prompt do sistema para geracao de resumo pos-sessao (AI Session Summary). Editavel pelo admin.'),

  ('ai_student_suggestion_prompt',
   'Voce e um assistente de mentoria especializado em engajamento de alunos. Com base nos dados do aluno (presenca, entregas, notas do mentor), sugira acoes personalizadas para o mentor melhorar o engajamento deste aluno. Inclua:
1. Diagnostico breve do perfil de engajamento
2. 3 acoes concretas e praticas
3. Mensagem sugerida para enviar ao aluno

Responda em portugues brasileiro, de forma empática e pratica. Use formatacao Markdown.',
   'Prompt do sistema para sugestoes de engajamento por aluno (AI Suggestion Engine). Editavel pelo admin.'),

  ('ai_mentor_api_config_key',
   'openai_api',
   'Chave da api_configs a ser usada para chamadas de IA do mentor (session prep, summary, suggestions). Altere para trocar de provedor.')
ON CONFLICT (key) DO NOTHING;

-- Churn score configurable weights
INSERT INTO public.app_configs (key, value, description)
VALUES
  ('churn_score_weights',
   '{"attendance_weight": 0.4, "submission_weight": 0.3, "recency_weight": 0.3, "high_risk_threshold": 30, "medium_risk_threshold": 60}',
   'Pesos e limiares para calculo do Churn Score de alunos. attendance_weight + submission_weight + recency_weight devem somar 1.0. Thresholds em porcentagem (abaixo = risco).')
ON CONFLICT (key) DO NOTHING;
