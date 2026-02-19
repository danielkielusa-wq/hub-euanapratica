import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGatekeeper } from '@/components/report/ReportGatekeeper';
import { FormattedReport } from '@/components/report/FormattedReport';
import { Loader2 } from 'lucide-react';
import type { CareerEvaluation } from '@/types/leads';

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string>('');
  const [evaluation, setEvaluation] = useState<CareerEvaluation | null>(null);
  const [formattedContent, setFormattedContent] = useState<string>('');
  const [tokenValid, setTokenValid] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkToken();
  }, [token]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (recPollRef.current) clearTimeout(recPollRef.current);
    };
  }, []);

  // Poll for product recommendation after report is loaded
  useEffect(() => {
    if (!evaluation || !formattedContent) return;
    if (evaluation.recommendation_status === 'completed') return;

    // Check if V2 report with a product tier
    let hasTier = false;
    try {
      const parsed = JSON.parse(formattedContent);
      if (parsed?.report_metadata?.report_version === '2.0') {
        const tier =
          parsed?.product_recommendation?.primary_offer?.recommended_product_tier ||
          parsed?.lead_qualification?.recommended_product_tier;
        hasTier = !!tier;
      }
    } catch { /* not V2 */ }

    if (!hasTier) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    const pollRecommendation = async () => {
      if (cancelled || attempts >= maxAttempts) return;
      attempts++;

      try {
        const { data } = await supabase.functions.invoke('recommend-product', {
          body: { evaluationId: evaluation.id },
        });

        if (data?.status === 'completed' && data?.recommendation) {
          setEvaluation((prev) =>
            prev
              ? {
                  ...prev,
                  recommended_product_name:
                    data.recommendation.recommended_service_name,
                  recommendation_description:
                    data.recommendation.recommendation_description,
                  recommendation_landing_page_url:
                    data.recommendation.landing_page_url,
                  recommendation_status: 'completed',
                }
              : prev
          );
          return;
        }

        // Still processing or pending - retry
        recPollRef.current = setTimeout(pollRecommendation, 3000);
      } catch {
        recPollRef.current = setTimeout(pollRecommendation, 5000);
      }
    };

    pollRecommendation();

    return () => {
      cancelled = true;
      if (recPollRef.current) clearTimeout(recPollRef.current);
    };
  }, [evaluation?.id, formattedContent]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((evaluationId: string) => {
    stopPolling();
    setProcessingStatus('processing');

    pollIntervalRef.current = setInterval(async () => {
      try {
        const { data, error: pollError } = await supabase.functions.invoke('format-lead-report', {
          body: { evaluationId }
        });

        if (pollError) return; // Keep polling on transient errors

        if (data?.status === 'processing') {
          return; // Still processing, keep polling
        }

        if (data?.content) {
          // Done! Stop polling and show report
          stopPolling();
          setProcessingStatus(null);
          setFormattedContent(
            typeof data.content === 'string'
              ? data.content
              : JSON.stringify(data.content)
          );
        }
      } catch {
        // Keep polling on network errors
      }
    }, 3000);
  }, [stopPolling]);

  const triggerOnDemand = useCallback(async (evaluationId: string, forceRefresh: boolean) => {
    setIsFormatting(true);
    try {
      const { data: formatted, error: formatError } = await supabase.functions.invoke('format-lead-report', {
        body: { evaluationId, forceRefresh }
      });

      // If the report is being processed by the trigger, switch to polling
      if (formatted?.status === 'processing') {
        setIsFormatting(false);
        startPolling(evaluationId);
        return;
      }

      if (!formatError && formatted?.content) {
        setFormattedContent(
          typeof formatted.content === 'string'
            ? formatted.content
            : JSON.stringify(formatted.content)
        );
      }
    } catch {
      // Will show fallback with raw content
    }
    setIsFormatting(false);
  }, [startPolling]);

  const checkToken = async () => {
    if (!token) {
      setError('Link inválido');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('verify-report-access', {
        body: { token, action: 'check' }
      });

      if (fetchError || !data?.valid) {
        setError('Este link não existe ou expirou.');
      } else {
        setTokenValid(true);
      }
    } catch (err) {
      setError('Erro ao verificar link.');
    }
    setIsLoading(false);
  };

  const handleVerify = async (email: string): Promise<boolean> => {
    setIsVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-report-access', {
        body: { token, email, action: 'verify' }
      });

      if (verifyError) {
        setError('Erro ao verificar. Tente novamente.');
        setIsVerifying(false);
        return false;
      }

      if (!data?.success) {
        setError(data?.message || 'Email não corresponde ao relatório.');
        setIsVerifying(false);
        return false;
      }

      setEvaluation(data.evaluation);
      setIsVerifying(false);

      if (data.evaluation.formatted_report) {
        // Pre-processed report available - instant display
        setFormattedContent(data.evaluation.formatted_report);
      } else if (data.evaluation.processing_status === 'processing') {
        // Currently being processed by trigger - poll until ready
        startPolling(data.evaluation.id);
      } else {
        // Pending or error - trigger on-demand (fallback)
        triggerOnDemand(data.evaluation.id, false);
      }

      return true;
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
      setIsVerifying(false);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tokenValid && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Link Inválido</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (evaluation) {
    return (
      <FormattedReport
        evaluation={evaluation}
        formattedContent={formattedContent}
        isLoading={isFormatting}
        processingStatus={processingStatus}
      />
    );
  }

  return (
    <ReportGatekeeper
      onVerify={handleVerify}
      isLoading={isVerifying}
      error={error}
    />
  );
}
