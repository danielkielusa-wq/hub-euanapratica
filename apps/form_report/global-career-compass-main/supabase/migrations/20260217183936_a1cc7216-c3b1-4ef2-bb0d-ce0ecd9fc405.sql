
CREATE TABLE public.leads_report (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  consentimento_marketing BOOLEAN NOT NULL DEFAULT false,
  area_profissional TEXT,
  anos_experiencia TEXT,
  nivel_ingles TEXT,
  objetivo TEXT,
  status_visto TEXT,
  prazo_movimento TEXT,
  composicao_familiar TEXT,
  faixa_investimento TEXT,
  principal_obstaculo TEXT,
  maior_duvida TEXT,
  tempo_conclusao INTEGER,
  dispositivo_usado TEXT,
  ultima_etapa_visualizada INTEGER DEFAULT 1,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_report ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public lead capture form)
CREATE POLICY "Anyone can insert leads"
  ON public.leads_report
  FOR INSERT
  WITH CHECK (true);

-- No select/update/delete for anonymous users
CREATE POLICY "No public read access"
  ON public.leads_report
  FOR SELECT
  USING (false);
