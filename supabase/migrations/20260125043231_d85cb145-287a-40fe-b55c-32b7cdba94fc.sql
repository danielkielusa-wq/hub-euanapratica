-- Criar enum para tipo de feedback
CREATE TYPE feedback_type AS ENUM ('bug', 'enhancement');

-- Criar enum para prioridade
CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high');

-- Criar enum para status
CREATE TYPE feedback_status AS ENUM (
  'new',
  'in_review', 
  'resolved',
  'considered_no_action',
  'discarded'
);

-- Tabela principal de feedbacks
CREATE TABLE public.feedback_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type feedback_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  priority feedback_priority NOT NULL DEFAULT 'medium',
  status feedback_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem criar feedback
CREATE POLICY "Users can create feedback"
  ON public.feedback_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem ver seus próprios feedbacks
CREATE POLICY "Users can view own feedback"
  ON public.feedback_items FOR SELECT
  USING (user_id = auth.uid());

-- Política: admins podem ver todos os feedbacks
CREATE POLICY "Admins can view all feedback"
  ON public.feedback_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Política: admins podem atualizar feedbacks
CREATE POLICY "Admins can update feedback"
  ON public.feedback_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_feedback_items_updated_at
  BEFORE UPDATE ON public.feedback_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();