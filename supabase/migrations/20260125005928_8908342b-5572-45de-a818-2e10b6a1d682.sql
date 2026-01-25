-- =====================================================
-- FASE 1: Sistema Administrativo - Schema do Banco
-- =====================================================

-- 1.1 Novos Enums
-- Categoria da turma
CREATE TYPE public.espaco_category AS ENUM (
  'immersion',
  'group_mentoring',
  'workshop',
  'bootcamp',
  'course'
);

-- Visibilidade da turma
CREATE TYPE public.espaco_visibility AS ENUM (
  'public',
  'private'
);

-- 1.2 Alterar Tabela espacos - adicionar novas colunas
ALTER TABLE public.espacos ADD COLUMN IF NOT EXISTS category public.espaco_category DEFAULT 'immersion';
ALTER TABLE public.espacos ADD COLUMN IF NOT EXISTS visibility public.espaco_visibility DEFAULT 'private';
ALTER TABLE public.espacos ADD COLUMN IF NOT EXISTS max_students INT DEFAULT 30;
ALTER TABLE public.espacos ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 1.3 Alterar Tabela user_espacos - adicionar novas colunas
ALTER TABLE public.user_espacos ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;
ALTER TABLE public.user_espacos ADD COLUMN IF NOT EXISTS enrolled_by UUID;
ALTER TABLE public.user_espacos ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.user_espacos ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMPTZ;

-- 1.4 Tabela products (Pacotes de Acesso)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  access_duration_days INT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.5 Tabela product_espacos (Relacionamento produto-turmas)
CREATE TABLE IF NOT EXISTS public.product_espacos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  espaco_id UUID REFERENCES public.espacos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, espaco_id)
);

-- 1.6 Tabela user_products (Acesso por Produto)
CREATE TABLE IF NOT EXISTS public.user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 1.7 Tabela enrollment_history (Auditoria de Matrículas)
CREATE TABLE IF NOT EXISTS public.enrollment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_espaco_id UUID,
  user_id UUID NOT NULL,
  espaco_id UUID REFERENCES public.espacos(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.8 Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_espacos_expires ON public.user_espacos(access_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_espacos_status ON public.user_espacos(status);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_user_products_user ON public.user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_expires ON public.user_products(expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollment_history_user ON public.enrollment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_history_espaco ON public.enrollment_history(espaco_id);

-- 1.9 Habilitar RLS nas novas tabelas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_history ENABLE ROW LEVEL SECURITY;

-- 1.10 Políticas RLS para products
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true OR public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 1.11 Políticas RLS para product_espacos
CREATE POLICY "Anyone can view product espacos"
ON public.product_espacos FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product espacos"
ON public.product_espacos FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 1.12 Políticas RLS para user_products
CREATE POLICY "Users can view own products"
ON public.user_products FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user products"
ON public.user_products FOR SELECT
USING (public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Admins can manage user products"
ON public.user_products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 1.13 Políticas RLS para enrollment_history
CREATE POLICY "Users can view own enrollment history"
ON public.enrollment_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollment history"
ON public.enrollment_history FOR SELECT
USING (public.is_admin_or_mentor(auth.uid()));

CREATE POLICY "Admins can create enrollment history"
ON public.enrollment_history FOR INSERT
WITH CHECK (public.is_admin_or_mentor(auth.uid()));

-- 1.14 Trigger para updated_at em products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 1.15 Função para registrar histórico de matrícula
CREATE OR REPLACE FUNCTION public.log_enrollment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.enrollment_history (user_espaco_id, user_id, espaco_id, action, new_status, performed_by)
    VALUES (NEW.id, NEW.user_id, NEW.espaco_id, 'enrolled', NEW.status, NEW.enrolled_by);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.enrollment_history (user_espaco_id, user_id, espaco_id, action, old_status, new_status, performed_by)
    VALUES (NEW.id, NEW.user_id, NEW.espaco_id, 'status_changed', OLD.status, NEW.status, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.enrollment_history (user_espaco_id, user_id, espaco_id, action, old_status, performed_by)
    VALUES (OLD.id, OLD.user_id, OLD.espaco_id, 'removed', OLD.status, auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1.16 Trigger para log de matrículas
DROP TRIGGER IF EXISTS log_enrollment_changes ON public.user_espacos;
CREATE TRIGGER log_enrollment_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_espacos
FOR EACH ROW
EXECUTE FUNCTION public.log_enrollment_change();