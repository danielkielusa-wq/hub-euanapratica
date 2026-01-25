-- Enum para status da tarefa
CREATE TYPE public.assignment_status AS ENUM ('draft', 'published', 'closed');

-- Enum para tipo de entrega
CREATE TYPE public.submission_type AS ENUM ('file', 'text', 'both');

-- Enum para status da submissão
CREATE TYPE public.submission_status AS ENUM ('draft', 'submitted', 'reviewed');

-- Enum para resultado da avaliação
CREATE TYPE public.review_result AS ENUM ('approved', 'revision', 'rejected');

-- Tabela de tarefas
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espaco_id UUID REFERENCES public.espacos(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  submission_type public.submission_type DEFAULT 'both',
  status public.assignment_status DEFAULT 'draft',
  max_file_size INT DEFAULT 10485760,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'docx', 'xlsx', 'zip'],
  allow_late_submission BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Tabela de materiais de apoio
CREATE TABLE public.assignment_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de submissões
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  status public.submission_status DEFAULT 'draft',
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  text_content TEXT,
  draft_saved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_result public.review_result,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_assignments_espaco ON public.assignments(espaco_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX idx_assignments_status ON public.assignments(status);
CREATE INDEX idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_user ON public.submissions(user_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);

-- Habilitar RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS para assignments
CREATE POLICY "Students can view published assignments from enrolled espacos"
ON public.assignments FOR SELECT
USING (
  (status = 'published' AND is_enrolled_in_espaco(auth.uid(), espaco_id))
  OR is_admin_or_mentor(auth.uid())
);

CREATE POLICY "Admins and mentors can create assignments"
ON public.assignments FOR INSERT
WITH CHECK (is_admin_or_mentor(auth.uid()));

CREATE POLICY "Admins and mentors can update assignments"
ON public.assignments FOR UPDATE
USING (is_admin_or_mentor(auth.uid()));

CREATE POLICY "Admins and mentors can delete assignments"
ON public.assignments FOR DELETE
USING (is_admin_or_mentor(auth.uid()));

-- RLS para assignment_materials
CREATE POLICY "Users can view assignment materials"
ON public.assignment_materials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = assignment_id
    AND (
      (a.status = 'published' AND is_enrolled_in_espaco(auth.uid(), a.espaco_id))
      OR is_admin_or_mentor(auth.uid())
    )
  )
);

CREATE POLICY "Admins and mentors can create assignment materials"
ON public.assignment_materials FOR INSERT
WITH CHECK (is_admin_or_mentor(auth.uid()));

CREATE POLICY "Admins and mentors can update assignment materials"
ON public.assignment_materials FOR UPDATE
USING (is_admin_or_mentor(auth.uid()));

CREATE POLICY "Admins and mentors can delete assignment materials"
ON public.assignment_materials FOR DELETE
USING (is_admin_or_mentor(auth.uid()));

-- RLS para submissions
CREATE POLICY "Students can view own submissions"
ON public.submissions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins and mentors can view all submissions"
ON public.submissions FOR SELECT
USING (is_admin_or_mentor(auth.uid()));

CREATE POLICY "Students can create own submissions"
ON public.submissions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own submissions"
ON public.submissions FOR UPDATE
USING (user_id = auth.uid() AND status != 'reviewed');

CREATE POLICY "Mentors can update submissions for review"
ON public.submissions FOR UPDATE
USING (is_admin_or_mentor(auth.uid()));

-- Storage bucket para submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false,
  10485760,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip']
);

-- Storage policies
CREATE POLICY "Authenticated users can upload submissions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view submissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own submission files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'submissions' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own submission files"
ON storage.objects FOR DELETE
USING (bucket_id = 'submissions' AND auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assignments_timestamp
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION update_assignments_updated_at();

CREATE TRIGGER update_submissions_timestamp
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION update_assignments_updated_at();