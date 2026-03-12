-- New notification type configs for Espacos (mentor & student events)

INSERT INTO public.notification_type_configs (type_key, display_name, description, icon, category, in_app_enabled, email_enabled) VALUES
  -- Student-facing
  ('espaco_new_assignment', 'Nova Tarefa no Espaco', 'Quando o mentor publica uma nova tarefa', 'clipboard-check', 'learning', true, false),
  ('espaco_assignment_reviewed', 'Tarefa Corrigida', 'Quando sua tarefa e corrigida pelo mentor', 'check-circle', 'learning', true, false),
  ('espaco_new_material', 'Novo Material', 'Quando o mentor adiciona novo material ao espaco', 'file-plus', 'learning', true, false),
  ('espaco_session_reminder', 'Lembrete de Sessao do Espaco', 'Lembrete antes de uma sessao do espaco comecar', 'clock', 'learning', true, false),

  -- Mentor-facing
  ('espaco_new_submission', 'Nova Entrega', 'Quando um aluno envia uma tarefa para correcao', 'inbox', 'learning', true, false),
  ('espaco_student_enrolled', 'Novo Aluno Matriculado', 'Quando um aluno se matricula no espaco', 'user-plus', 'learning', true, false),
  ('espaco_low_engagement', 'Aluno com Baixo Engajamento', 'Quando um aluno atinge nivel critico de engajamento', 'alert-triangle', 'learning', true, false),
  ('espaco_assignment_deadline', 'Prazo de Tarefa Proximo', 'Quando o prazo de uma tarefa esta proximo (24h)', 'alarm-clock', 'learning', true, false)
ON CONFLICT (type_key) DO NOTHING;

-- Email templates for espaco notifications
INSERT INTO public.email_templates (name, display_name, subject, body_html, variables, category, description, enabled) VALUES
  ('espaco_new_assignment',
   'Nova Tarefa Publicada',
   'Nova tarefa: {{assignmentTitle}}',
   '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
     <h2>Nova tarefa disponivel!</h2>
     <p>Ola, {{studentName}}!</p>
     <p>O mentor publicou uma nova tarefa no espaco <strong>{{espacoName}}</strong>:</p>
     <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
       <h3 style="margin: 0 0 8px;">{{assignmentTitle}}</h3>
       <p style="margin: 0; color: #666;">Prazo: {{dueDate}}</p>
     </div>
     <a href="{{assignmentUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Ver Tarefa</a>
   </div>',
   '[{"name":"studentName","description":"Nome do aluno"},{"name":"espacoName","description":"Nome do espaco"},{"name":"assignmentTitle","description":"Titulo da tarefa"},{"name":"dueDate","description":"Data de entrega"},{"name":"assignmentUrl","description":"Link para a tarefa"}]',
   'espacos',
   'Email enviado ao aluno quando uma nova tarefa e publicada no espaco',
   true),

  ('espaco_assignment_reviewed',
   'Tarefa Corrigida',
   'Sua tarefa foi corrigida: {{assignmentTitle}}',
   '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
     <h2>Sua tarefa foi corrigida!</h2>
     <p>Ola, {{studentName}}!</p>
     <p>O mentor corrigiu sua entrega da tarefa <strong>{{assignmentTitle}}</strong> no espaco <strong>{{espacoName}}</strong>.</p>
     <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
       <p style="margin: 0;"><strong>Resultado:</strong> {{reviewResult}}</p>
       {{feedbackSection}}
     </div>
     <a href="{{assignmentUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Ver Detalhes</a>
   </div>',
   '[{"name":"studentName","description":"Nome do aluno"},{"name":"espacoName","description":"Nome do espaco"},{"name":"assignmentTitle","description":"Titulo da tarefa"},{"name":"reviewResult","description":"Resultado (Aprovada/Revisao)"},{"name":"feedbackSection","description":"Secao de feedback"},{"name":"assignmentUrl","description":"Link para a tarefa"}]',
   'espacos',
   'Email enviado ao aluno quando sua tarefa e corrigida pelo mentor',
   true),

  ('espaco_new_submission',
   'Nova Entrega de Aluno',
   'Nova entrega: {{studentName}} - {{assignmentTitle}}',
   '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
     <h2>Nova entrega para correcao!</h2>
     <p>O aluno <strong>{{studentName}}</strong> enviou uma entrega da tarefa <strong>{{assignmentTitle}}</strong> no espaco <strong>{{espacoName}}</strong>.</p>
     <a href="{{submissionUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Corrigir Entrega</a>
   </div>',
   '[{"name":"studentName","description":"Nome do aluno"},{"name":"espacoName","description":"Nome do espaco"},{"name":"assignmentTitle","description":"Titulo da tarefa"},{"name":"submissionUrl","description":"Link para correcao"}]',
   'espacos',
   'Email enviado ao mentor quando um aluno envia uma entrega',
   true)
ON CONFLICT (name) DO NOTHING;
