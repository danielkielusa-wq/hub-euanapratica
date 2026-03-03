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
  const [accessLevel, setAccessLevel] = useState<'full' | 'limited'>('limited');
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [referralUnlocked, setReferralUnlocked] = useState<boolean>(false);
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

    // Check if report has a product tier (works for both V2 and N8N-generated reports)
    let hasTier = false;
    try {
      const parsed = JSON.parse(formattedContent);
      const tier =
        parsed?.product_recommendation?.primary_offer?.recommended_product_tier ||
        parsed?.lead_qualification?.recommended_product_tier;
      hasTier = !!tier;
    } catch { /* not parseable */ }

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
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((evaluationId: string) => {
    stopPolling();
    setProcessingStatus('processing');

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // ~3 minutes with backoff

    const poll = async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        stopPolling();
        setProcessingStatus(null);
        setError('O relatório está demorando mais que o esperado. Recarregue a página para tentar novamente.');
        return;
      }

      try {
        const { data, error: pollError } = await supabase.functions.invoke('format-lead-report', {
          body: { evaluationId }
        });

        if (pollError) {
          // Schedule next poll with backoff
          const delay = Math.min(3000 * Math.pow(1.5, Math.min(attempts, 8)), 30000);
          pollIntervalRef.current = setTimeout(poll, delay);
          return;
        }

        if (data?.status === 'processing') {
          // Still processing — backoff: 3s → 4.5s → 6.75s → ... → max 30s
          const delay = Math.min(3000 * Math.pow(1.5, Math.min(attempts, 8)), 30000);
          pollIntervalRef.current = setTimeout(poll, delay);
          return;
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
        // Schedule next poll with backoff on network errors
        const delay = Math.min(3000 * Math.pow(1.5, Math.min(attempts, 8)), 30000);
        pollIntervalRef.current = setTimeout(poll, delay);
      }
    };

    // Start first poll after 3s
    pollIntervalRef.current = setTimeout(poll, 3000);
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

  // Mark step_view_report in guided_tour_state when an authenticated user views their report
  useEffect(() => {
    if (!evaluation) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('guided_tour_state')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          const current = (data.guided_tour_state as Record<string, unknown>) || {};
          if (!current.step_view_report) {
            supabase
              .from('profiles')
              .update({ guided_tour_state: { ...current, step_view_report: true } })
              .eq('id', user.id)
              .then(() => {});
          }
        });
    });
  }, [evaluation?.id]);

  const checkToken = async () => {
    if (!token) {
      setError('Link inválido');
      setIsLoading(false);
      return;
    }

    // Check if current user is admin — admin bypasses email verification
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          // Admin: fetch evaluation directly and skip email gate
          const { data: evalData, error: evalError } = await supabase
            .from('career_evaluations')
            .select('id, name, email, area, atuacao, experiencia, english_level, objetivo, visa_status, timeline, family_status, formatted_report, processing_status, recommendation_status, recommended_product_name, recommendation_description, recommendation_landing_page_url, formatted_at, created_at, updated_at, referral_code, referral_count, referral_unlocked')
            .eq('access_token', token)
            .maybeSingle();

          if (!evalError && evalData) {
            setAccessLevel('full');
            setReferralCode((evalData as Record<string, unknown>).referral_code as string || '');
            setReferralCount((evalData as Record<string, unknown>).referral_count as number || 0);
            setReferralUnlocked((evalData as Record<string, unknown>).referral_unlocked as boolean || false);
            setEvaluation(evalData as CareerEvaluation);
            if (evalData.formatted_report) {
              setFormattedContent(evalData.formatted_report as string);
            } else if (evalData.processing_status === 'processing') {
              startPolling(evalData.id);
            } else {
              triggerOnDemand(evalData.id, false);
            }
            setIsLoading(false);
            return;
          }
        }

        // Authenticated non-admin: auto-verify with their email (skip email gate)
        if (user.email) {
          const { data: autoData, error: autoError } = await supabase.functions.invoke('verify-report-access', {
            body: { token, email: user.email, action: 'verify' },
          });

          if (!autoError && autoData?.success) {
            setAccessLevel(autoData.access_level ?? 'limited');
            setReferralCode(autoData.evaluation?.referral_code || '');
            setReferralCount(autoData.evaluation?.referral_count || 0);
            setReferralUnlocked(autoData.evaluation?.referral_unlocked || false);
            setEvaluation(autoData.evaluation);
            if (autoData.evaluation.formatted_report) {
              setFormattedContent(autoData.evaluation.formatted_report);
            } else if (autoData.evaluation.processing_status === 'processing') {
              startPolling(autoData.evaluation.id);
            } else {
              triggerOnDemand(autoData.evaluation.id, false);
            }
            setIsLoading(false);
            return;
          }
        }
      }
    } catch {
      // Non-blocking: continue with normal flow if auth check fails
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

      setAccessLevel(data.access_level ?? 'limited');
      setReferralCode(data.evaluation?.referral_code || '');
      setReferralCount(data.evaluation?.referral_count || 0);
      setReferralUnlocked(data.evaluation?.referral_unlocked || false);
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
        accessLevel={accessLevel}
        referralCode={referralCode}
        referralCount={referralCount}
        referralUnlocked={referralUnlocked}
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
