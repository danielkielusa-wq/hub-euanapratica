-- Add all espaco-related notification types to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'espaco_new_assignment';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'espaco_assignment_reviewed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'espaco_new_submission';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'espaco_student_enrolled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'espaco_new_material';

-- Add type configs for each
INSERT INTO notification_type_configs (type_key, display_name, description, icon, category, in_app_enabled, email_enabled)
VALUES
  ('espaco_new_assignment', 'Nova Tarefa', 'Quando uma nova tarefa e publicada no espaco', 'clipboard-list', 'learning', true, false),
  ('espaco_assignment_reviewed', 'Tarefa Corrigida', 'Quando sua entrega e avaliada pelo mentor', 'check-square', 'learning', true, false),
  ('espaco_new_submission', 'Nova Entrega', 'Quando um aluno envia uma tarefa', 'upload', 'learning', true, false),
  ('espaco_student_enrolled', 'Novo Aluno', 'Quando um aluno se matricula no espaco', 'user-plus', 'learning', true, false),
  ('espaco_new_material', 'Novo Material', 'Quando novo material e adicionado ao espaco', 'file-plus', 'learning', true, false)
ON CONFLICT (type_key) DO NOTHING;
