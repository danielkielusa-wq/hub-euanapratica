import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';

export interface Suggestion {
  title_us: string;
  confidence: number;
  explanation: string;
  why_this_fits: string;
  example_companies: string[];
  salary_range: string;
  example_jd_snippet: string;
}

export interface TranslationResult {
  suggestions: Suggestion[];
  recommended: string;
  reasoning: string;
}

interface FormData {
  titleBr: string;
  area: string;
  responsibilities: string;
  years: string;
}

interface AppQuota {
  planId: string;
  planName: string;
  monthlyLimit: number;
  usedThisMonth: number;
  remaining: number;
}

type TranslationStatus = 'idle' | 'loading' | 'success' | 'error' | 'limit_reached';

export function useTitleTranslator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logEvent } = useAnalytics();

  const [status, setStatus] = useState<TranslationStatus>('idle');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState<AppQuota | null>(null);
  const [formData, setFormData] = useState<FormData>({
    titleBr: '',
    area: '',
    responsibilities: '',
    years: '',
  });

  // Fetch title_translator-specific quota via generic get_app_quota RPC
  const fetchQuota = useCallback(async () => {
    if (!user?.id) {
      setQuota(null);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_app_quota', { p_user_id: user.id, p_app_id: 'title_translator' });

      if (rpcError) {
        console.error('[useTitleTranslator] Error fetching quota:', rpcError);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setQuota({
          planId: row.plan_id,
          planName: row.plan_name,
          monthlyLimit: row.monthly_limit,
          usedThisMonth: row.used_this_month,
          remaining: row.remaining,
        });
      } else {
        setQuota({
          planId: 'basic',
          planName: 'Básico',
          monthlyLimit: 1,
          usedThisMonth: 0,
          remaining: 1,
        });
      }
    } catch (err) {
      console.error('[useTitleTranslator] Error loading quota:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const updateForm = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const translate = useCallback(async () => {
    if (!formData.titleBr.trim()) {
      setError('Por favor, informe seu titulo atual.');
      return;
    }

    // Client-side quota check
    if (quota && quota.remaining <= 0) {
      setStatus('limit_reached');
      setError('Voce atingiu o limite mensal. Faca upgrade para continuar.');
      toast({
        title: 'Limite de traducoes atingido',
        description: `Voce ja usou suas ${quota.monthlyLimit} traducao(es) do plano ${quota.planName} este mes.`,
        variant: 'destructive',
      });
      return;
    }

    logEvent({
      event_type: 'title_translator_translate_click',
      metadata: {
        title_br: formData.titleBr,
        area: formData.area || null,
        has_responsibilities: !!formData.responsibilities,
        years: formData.years || null,
      },
    });

    setError('');
    setStatus('loading');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('translate-title', {
        body: {
          titleBr: formData.titleBr.trim(),
          area: formData.area || null,
          responsibilities: formData.responsibilities || null,
          years: formData.years || null,
        },
      });

      // Extract error data from either fnError or response body
      const errorData = data?.error_code ? data : null;
      let errorBody: any = null;

      if (fnError) {
        // Try to extract the actual error from the response
        try {
          // Supabase FunctionsHttpError may have context with the response
          if ('context' in fnError && (fnError as any).context?.body) {
            errorBody = JSON.parse(new TextDecoder().decode((fnError as any).context.body));
          }
        } catch { /* ignore parse errors */ }

        // Also try parsing the error message itself
        if (!errorBody) {
          try {
            errorBody = JSON.parse(fnError.message);
          } catch { /* ignore */ }
        }
      }

      const resolvedError = errorData || errorBody;

      // Handle limit reached
      if (resolvedError?.error_code === 'LIMIT_REACHED') {
        setStatus('limit_reached');
        const msg = resolvedError.error_message || 'Limite mensal atingido.';
        setError(msg);
        toast({
          title: 'Limite mensal atingido',
          description: msg,
          variant: 'destructive',
        });
        await fetchQuota();
        return;
      }

      // Handle other known error codes with clear messages
      if (resolvedError?.error) {
        throw new Error(resolvedError.error);
      }

      // If we have fnError but couldn't extract a specific message
      if (fnError) {
        throw new Error('Erro ao conectar com o servidor. Verifique os logs ou tente novamente.');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data as TranslationResult);
      setStatus('success');
      await fetchQuota();

      logEvent({
        event_type: 'title_translator_success',
        metadata: {
          title_br: formData.titleBr,
          recommended: data.recommended,
        },
      });

      toast({
        title: 'Traducao concluida!',
        description: `Titulo recomendado: ${data.recommended}`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao traduzir. Tente novamente.';
      setStatus('error');
      setError(errorMessage);
      await fetchQuota();

      toast({
        title: 'Erro na traducao',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [formData, quota, fetchQuota, toast, logEvent]);

  const reset = useCallback(() => {
    setResult(null);
    setStatus('idle');
    setError('');
    setFormData({ titleBr: '', area: '', responsibilities: '', years: '' });
  }, []);

  const hasCredits = quota ? quota.remaining > 0 : true;

  return {
    status,
    result,
    error,
    formData,
    updateForm,
    translate,
    reset,
    quota,
    hasCredits,
    canTranslate: !!formData.titleBr.trim() && hasCredits && status !== 'loading',
  };
}
