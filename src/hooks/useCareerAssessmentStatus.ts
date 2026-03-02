import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CareerInsights } from '@/types/hub';

// 12 required fields (maior_duvida is optional)
const REQUIRED_CAREER_FIELDS = [
  'area_profissional',
  'nivel_ingles',
  'objetivo',
  'prazo_movimento',
  'cargo_atual',
  'anos_experiencia',
  'trabalha_internacional',
  'status_visto',
  'composicao_familiar',
  'faixa_renda',
  'faixa_investimento',
  'principal_obstaculo',
] as const;

type CareerField = (typeof REQUIRED_CAREER_FIELDS)[number];

export type CareerAssessmentState =
  | 'incomplete_data'
  | 'generating'
  | 'needs_subscription'
  | 'full_access';

export interface CareerAssessmentStatus {
  state: CareerAssessmentState;
  filledCount: number;
  totalRequired: number;
  completionPercent: number;
  missingFields: CareerField[];
  filledFields: Record<string, string | null>;
  isLoading: boolean;
}

const ALL_FIELDS = [...REQUIRED_CAREER_FIELDS, 'maior_duvida'] as const;

const SELECT_FIELDS = ALL_FIELDS.join(', ');

interface UseCareerAssessmentStatusParams {
  careerInsights: CareerInsights | null;
  hasFullReportAccess: boolean;
}

export function useCareerAssessmentStatus({
  careerInsights,
  hasFullReportAccess,
}: UseCareerAssessmentStatusParams): CareerAssessmentStatus {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query 1: Profile career fields
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['career-assessment-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(SELECT_FIELDS)
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data as Record<string, string | null>;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Compute field status
  const filledFields: Record<string, string | null> = {};
  const missingFields: CareerField[] = [];
  let filledCount = 0;

  for (const field of REQUIRED_CAREER_FIELDS) {
    const value = profile?.[field];
    filledFields[field] = value ?? null;
    if (value && value.trim() !== '') {
      filledCount++;
    } else {
      missingFields.push(field);
    }
  }
  // Also include optional field
  filledFields['maior_duvida'] = profile?.['maior_duvida'] ?? null;

  const allFieldsFilled = missingFields.length === 0;
  const totalRequired = REQUIRED_CAREER_FIELDS.length;
  const completionPercent = totalRequired > 0 ? Math.round((filledCount / totalRequired) * 100) : 0;

  // Evaluation status: polling (reliable) + Realtime (instant when available)
  const hasReport = careerInsights?.hasReport ?? false;

  // Polling backbone — guaranteed to detect completion within 10s
  const { data: evalStatus, isLoading: evalLoading } = useQuery({
    queryKey: ['career-evaluation-status', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('career_evaluations')
        .select('processing_status')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.processing_status as string | null;
    },
    enabled: !!user?.id && allFieldsFilled && !hasReport,
    refetchInterval: (query) => {
      const status = query.state.data;
      return status === 'pending' || status === 'processing' ? 10000 : false;
    },
  });

  // Realtime accelerator — instantly updates query cache when edge function finishes
  useEffect(() => {
    if (!user?.id || !allFieldsFilled || hasReport) return;

    const channel = supabase
      .channel(`career-eval-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_evaluations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>)?.processing_status as string | undefined;
          if (newStatus) {
            queryClient.setQueryData(['career-evaluation-status', user.id], newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, allFieldsFilled, hasReport, queryClient]);

  // When evaluation completes, refetch career-insights to get the actual report
  useEffect(() => {
    if (evalStatus === 'completed' && !hasReport) {
      queryClient.invalidateQueries({ queryKey: ['career-insights'] });
    }
  }, [evalStatus, hasReport, queryClient]);

  // Determine state
  let state: CareerAssessmentState;

  if (!allFieldsFilled) {
    state = 'incomplete_data';
  } else if (!hasReport) {
    // All fields filled but no completed report
    const isProcessing = evalStatus === 'pending' || evalStatus === 'processing';
    // evalStatus 'completed' but hasReport still false → cache is refreshing, treat as generating
    const isCompletedButCacheStale = evalStatus === 'completed';
    state = isProcessing || evalLoading || isCompletedButCacheStale ? 'generating' : 'incomplete_data';
    // Edge case: allFieldsFilled but no evaluation record yet → still incomplete_data
    if (evalStatus === null && !evalLoading) {
      state = 'incomplete_data';
    }
  } else if (!hasFullReportAccess) {
    state = 'needs_subscription';
  } else {
    state = 'full_access';
  }

  return {
    state,
    filledCount,
    totalRequired,
    completionPercent,
    missingFields,
    filledFields,
    isLoading: profileLoading,
  };
}
