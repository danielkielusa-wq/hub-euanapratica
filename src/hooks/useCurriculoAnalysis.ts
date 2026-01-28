import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import type { FullAnalysisResult, AnalysisError } from '@/types/curriculo';
import { CURRICULO_RESULT_STORAGE_KEY } from '@/types/curriculo';

type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error' | 'limit_reached';

interface AnalysisState {
  status: AnalysisStatus;
  uploadedFile: File | null;
  jobDescription: string;
  result: FullAnalysisResult | null;
  error: string | null;
}

interface LimitReachedResponse {
  error_code: 'LIMIT_REACHED';
  error: string;
  error_message: string;
  plan_id: string;
  monthly_limit: number;
  used: number;
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

    // Check quota before proceeding (client-side check for better UX)
    if (quota && quota.remaining <= 0) {
      setShowUpgradeModal(true);
      toast({
        title: 'Limite de análises atingido',
        description: `Você já usou suas ${quota.monthlyLimit} análise(s) do plano ${quota.planName} este mês.`,
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

      // Check for 402 LIMIT_REACHED error from edge function
      if (error) {
        // Check if it's a FunctionsHttpError with status 402
        const errorBody = error.message;
        try {
          const parsedError = JSON.parse(errorBody);
          if (parsedError.error_code === 'LIMIT_REACHED') {
            setState(prev => ({
              ...prev,
              status: 'limit_reached',
              error: parsedError.error_message,
            }));
            setShowUpgradeModal(true);
            toast({
              title: 'Limite mensal atingido',
              description: parsedError.error_message,
              variant: 'destructive',
            });
            // Refetch quota to update UI
            await refetchQuota();
            return;
          }
        } catch {
          // Not a JSON error, handle normally
        }
        throw error;
      }

      // Check for 402 response in data (edge function might return it in body)
      if (data?.error_code === 'LIMIT_REACHED') {
        const limitData = data as LimitReachedResponse;
        setState(prev => ({
          ...prev,
          status: 'limit_reached',
          error: limitData.error_message,
        }));
        setShowUpgradeModal(true);
        toast({
          title: 'Limite mensal atingido',
          description: limitData.error_message,
          variant: 'destructive',
        });
        await refetchQuota();
        return;
      }

      // Check for parsing errors from the edge function
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
      
      // Usage is now recorded in the edge function, just refetch quota
      await refetchQuota();
      
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
      
      // Always refetch quota on error to sync state with server
      await refetchQuota();
      
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
    showUpgradeModal,
    setShowUpgradeModal,
  };
}
