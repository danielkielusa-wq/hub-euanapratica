-- Create career_evaluations table for lead report import
CREATE TABLE public.career_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Lead data from CSV
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  area TEXT,
  atuacao TEXT,
  trabalha_internacional BOOLEAN DEFAULT false,
  experiencia TEXT,
  english_level TEXT,
  objetivo TEXT,
  visa_status TEXT,
  timeline TEXT,
  family_status TEXT,
  income_range TEXT,
  investment_range TEXT,
  impediment TEXT,
  impediment_other TEXT,
  main_concern TEXT,
  
  -- Report content (raw from CSV)
  report_content TEXT NOT NULL,
  
  -- AI-formatted report (generated on-demand)
  formatted_report TEXT,
  formatted_at TIMESTAMPTZ,
  
  -- Access tracking
  access_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  first_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Metadata
  imported_by UUID REFERENCES public.profiles(id),
  import_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.career_evaluations ENABLE ROW LEVEL SECURITY;

-- Index for fast token lookup (public access)
CREATE INDEX idx_career_evaluations_access_token ON career_evaluations(access_token);
CREATE INDEX idx_career_evaluations_email ON career_evaluations(email);
CREATE INDEX idx_career_evaluations_user_id ON career_evaluations(user_id);

-- RLS Policies
-- Admins can manage all evaluations
CREATE POLICY "Admins can manage career_evaluations"
  ON career_evaluations FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Users can view their own evaluations
CREATE POLICY "Users can view own evaluations"
  ON career_evaluations FOR SELECT
  USING (user_id = auth.uid());

-- Insert the formatter prompt config
INSERT INTO app_configs (key, value, description)
VALUES (
  'lead_report_formatter_prompt',
  'Você é um especialista em formatação de relatórios de diagnóstico de carreira internacional. Seu trabalho é transformar dados brutos de avaliação em um relatório profissional, motivador e visualmente organizado.

ESTRUTURA DO RELATÓRIO:

1. SAUDAÇÃO PERSONALIZADA
- Cumprimento caloroso usando o nome do lead
- Parágrafo motivacional sobre a jornada internacional

2. DIAGNÓSTICO DE PRONTIDÃO (4 métricas)
- Experiência Profissional: Avaliar com base no campo experiencia
- Nível de Inglês: Usar english_level para classificar (Básico/Intermediário/Avançado/Fluente)
- Situação Financeira: Baseado em income_range e investment_range
- Timeline de Imigração: Usar timeline para indicar urgência

3. MÉTODO ROTA EUA™
- Explicar brevemente as 4 etapas: Preparação, Qualificação, Execução, Estabelecimento
- Indicar em qual etapa o lead se encontra baseado nos dados

4. PLANO DE AÇÃO (3 Passos)
- Passo 1: Ação imediata baseada nos impedimentos identificados
- Passo 2: Próximo marco importante
- Passo 3: Objetivo de médio prazo

5. RECURSOS RECOMENDADOS
- Sugerir 2-3 recursos relevantes baseados no objetivo e área de atuação

Use formatação Markdown com headers, bullets e emojis para deixar o relatório visualmente atraente. Seja profissional mas acolhedor.',
  'Prompt de IA para formatar relatórios de diagnóstico de leads importados via CSV'
);

-- Trigger for updated_at
CREATE TRIGGER update_career_evaluations_updated_at
  BEFORE UPDATE ON public.career_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();