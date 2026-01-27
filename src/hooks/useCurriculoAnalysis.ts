import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import type { FullAnalysisResult, AnalysisError } from '@/types/curriculo';
import { CURRICULO_RESULT_STORAGE_KEY } from '@/types/curriculo';

type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

interface AnalysisState {
  status: AnalysisStatus;
  uploadedFile: File | null;
  jobDescription: string;
  result: FullAnalysisResult | null;
  error: string | null;
}

export function useCurriculoAnalysis() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { quota, recordUsage, refetch: refetchQuota } = useSubscription();
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
    localStorage.removeItem(CURRICULO_RESULT_STORAGE_KEY);
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

    // Check quota before proceeding
    if (quota && quota.remaining <= 0) {
      toast({
        title: 'Limite de análises atingido',
        description: `Você já usou suas ${quota.monthlyLimit} análises do plano ${quota.planName} este mês. Faça upgrade para continuar.`,
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

      // Step 3: Clean up - delete temp file
      await supabase.storage.from('temp-resumes').remove([filePath]);

      // Check for parsing errors from the edge function
      if (error) {
        throw error;
      }

      // Check if response contains error codes
      if (data?.error_code || data?.parsing_error) {
        const errorData = data as AnalysisError;
        toast({
          title: errorData.error || 'Erro no processamento',
          description: errorData.error_message || 'Não foi possível processar seu currículo.',
          variant: 'destructive',
        });
        setState(prev => ({
          ...prev,
          status: 'error',
          error: errorData.error_message,
        }));
        return;
      }

      // Step 4: Store result in localStorage and navigate
      localStorage.setItem(CURRICULO_RESULT_STORAGE_KEY, JSON.stringify(data));
      
      // Step 5: Record usage after successful analysis
      await recordUsage();
      
      setState(prev => ({
        ...prev,
        status: 'complete',
        result: data,
      }));

      toast({
        title: 'Análise concluída!',
        description: `Seu currículo obteve ${data.header?.score ?? data.score}% de compatibilidade.`,
      });

      // Navigate to report page
      navigate('/curriculo/resultado');

    } catch (error: unknown) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao analisar currículo';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      
      toast({
        title: 'Erro na análise',
        description: errorMessage || 'Não foi possível analisar seu currículo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return {
    ...state,
    quota,
    setFile,
    setJobDescription,
    analyze,
    reset,
    canAnalyze: !!state.uploadedFile && !!state.jobDescription.trim() && (!quota || quota.remaining > 0),
    refetchQuota,
  };
}
