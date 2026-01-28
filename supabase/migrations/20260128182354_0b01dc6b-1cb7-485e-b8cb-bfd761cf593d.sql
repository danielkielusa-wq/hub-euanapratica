-- Create hub_services table for service catalog
CREATE TABLE public.hub_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'premium', 'coming_soon')),
  route TEXT,
  category TEXT,
  is_visible_in_hub BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  stripe_price_id TEXT,
  product_type TEXT DEFAULT 'subscription' CHECK (product_type IN ('subscription', 'one_time')),
  price_display TEXT,
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_hub_services table for tracking user access
CREATE TABLE public.user_hub_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, service_id)
);

-- Enable RLS
ALTER TABLE public.hub_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hub_services ENABLE ROW LEVEL SECURITY;

-- RLS for hub_services: Authenticated users can read visible services
CREATE POLICY "Authenticated users can view visible hub services"
ON public.hub_services
FOR SELECT
USING (is_visible_in_hub = true AND auth.role() = 'authenticated');

-- Admins can manage hub_services
CREATE POLICY "Admins can manage hub services"
ON public.hub_services
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for user_hub_services: Users can view their own access
CREATE POLICY "Users can view own hub service access"
ON public.user_hub_services
FOR SELECT
USING (user_id = auth.uid());

-- Admins can manage all user hub services
CREATE POLICY "Admins can manage user hub services"
ON public.user_hub_services
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Seed initial services data
INSERT INTO public.hub_services (name, description, icon_name, status, route, category, is_highlighted, display_order, price_display) VALUES
('Portal do Aluno', 'Acesse suas mentorias, aulas gravadas, atividades e conecte-se com sua turma.', 'GraduationCap', 'available', '/dashboard', 'Educação', false, 1, 'Incluído'),
('Currículo USA', 'Valide se seu currículo passa nos robôs (ATS) das empresas americanas com nossa IA.', 'FileCheck', 'available', '/curriculo', 'Carreira', true, 2, 'Grátis'),
('Certificados', 'Centralize e valide seus certificados e diplomas traduzidos para aplicação.', 'Award', 'available', '/certificados', 'Educação', false, 3, 'Incluído'),
('Mock Interview AI', 'Treine para entrevistas em inglês com um recrutador virtual e receba feedback instantâneo.', 'Monitor', 'premium', NULL, 'Carreira', false, 4, 'R$97/mês'),
('Visa Journey', 'Organize documentos, prazos e etapas do seu processo de visto O-1 ou EB-2 NIW.', 'Globe', 'coming_soon', NULL, 'Imigração', false, 5, 'Em Breve'),
('Job Hunter', 'Concierge de vagas "escondidas" no mercado americano curadas para brasileiros.', 'Building2', 'coming_soon', NULL, 'Carreira', false, 6, 'Em Breve');