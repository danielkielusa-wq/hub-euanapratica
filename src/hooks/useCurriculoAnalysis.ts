import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResultData } from '@/components/curriculo/AnalysisResult';

type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

interface AnalysisState {
  status: AnalysisStatus;
  uploadedFile: File | null;
  jobDescription: string;
  result: AnalysisResultData | null;
  error: string | null;
}

export function useCurriculoAnalysis() {
  const { toast } = useToast();
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    uploadedFile: null,
    jobDescription: '',
    result: null,
    error: null,
  });

  const setFile = (file: File | null) => {
    setState(prev => ({ ...prev, uploadedFile: file }));
  };

  const setJobDescription = (description: string) => {
    setState(prev => ({ ...prev, jobDescription: description }));
  };

  const reset = () => {
    setState({
      status: 'idle',
      uploadedFile: null,
      jobDescription: '',
      result: null,
      error: null,
    });
  };

  const analyze = async () => {
    if (!state.uploadedFile || !state.jobDescription.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, envie seu currículo e cole a descrição da vaga.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Upload file
      setState(prev => ({ ...prev, status: 'uploading', error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = state.uploadedFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('temp-resumes')
        .upload(filePath, state.uploadedFile);

      if (uploadError) throw uploadError;

      // Step 2: Call edge function for analysis
      setState(prev => ({ ...prev, status: 'analyzing' }));

      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          filePath,
          jobDescription: state.jobDescription,
        },
      });

      if (error) throw error;

      // Step 3: Clean up - delete temp file
      await supabase.storage.from('temp-resumes').remove([filePath]);

      // Step 4: Set result
      setState(prev => ({
        ...prev,
        status: 'complete',
        result: data,
      }));

      toast({
        title: 'Análise concluída!',
        description: `Seu currículo obteve ${data.score}% de compatibilidade.`,
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Erro ao analisar currículo',
      }));
      
      toast({
        title: 'Erro na análise',
        description: error.message || 'Não foi possível analisar seu currículo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return {
    ...state,
    setFile,
    setJobDescription,
    analyze,
    reset,
    canAnalyze: !!state.uploadedFile && !!state.jobDescription.trim(),
  };
}
