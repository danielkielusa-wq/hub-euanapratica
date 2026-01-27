-- Create app_configs table for storing configurable settings like AI prompts
CREATE TABLE public.app_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

-- Create policy: Everyone can read configs
CREATE POLICY "Anyone can read app configs" 
ON public.app_configs 
FOR SELECT 
USING (true);

-- Create policy: Only admins can insert configs
CREATE POLICY "Admins can insert app configs" 
ON public.app_configs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create policy: Only admins can update configs
CREATE POLICY "Admins can update app configs" 
ON public.app_configs 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Create policy: Only admins can delete configs
CREATE POLICY "Admins can delete app configs" 
ON public.app_configs 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_configs_updated_at
BEFORE UPDATE ON public.app_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default AI prompt for resume analyzer
INSERT INTO public.app_configs (key, value, description) VALUES (
    'resume_analyzer_prompt',
    'Você é um especialista em recrutamento e ATS (Applicant Tracking Systems) do mercado americano.

Analise o currículo fornecido em comparação com a descrição da vaga e forneça:

1. **Score de Compatibilidade** (0-100): Baseado em keywords, experiência e formatação
2. **Pontos Fortes**: O que no currículo se alinha bem com a vaga
3. **Melhorias Sugeridas**: O que precisa ser ajustado para aumentar as chances
4. **Análise de Keywords**: 
   - Keywords encontradas no currículo
   - Keywords importantes da vaga que estão faltando

Considere os padrões americanos de formatação de currículo:
- Uma página para até 10 anos de experiência
- Foco em resultados quantificáveis
- Verbos de ação no passado
- Sem foto, idade ou informações pessoais desnecessárias

Responda em português brasileiro de forma clara e direta.',
    'Prompt de IA para análise de currículos no Currículo USA'
);

-- Create storage bucket for temporary resume uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('temp-resumes', 'temp-resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for temp-resumes bucket
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'temp-resumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can read own resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);