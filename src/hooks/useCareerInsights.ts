import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isV2Report } from '@/types/leads';
import type { V2FormattedReportData } from '@/types/leads';
import type { CareerInsights, DimensionInsight } from '@/types/hub';
import { BREAKDOWN_DIMENSIONS, SCORE_MAX } from '@/components/report/v2/scoring';

const EMPTY_INSIGHTS: CareerInsights = {
  hasReport: false,
  score: 0,
  phase: null,
  temperature: null,
  shortDiagnosis: null,
  dimensions: [],
  weakest: null,
  strongest: null,
  criticalGaps: [],
  strengths: [],
  recommendedFirstAction: null,
  reportToken: null,
};

function buildDimensions(data: V2FormattedReportData): DimensionInsight[] {
  const breakdown = data.scoring?.score_breakdown;
  const analysis = data.detailed_analysis;
  if (!breakdown) return [];

  return BREAKDOWN_DIMENSIONS
    .filter((d) => d.analysisKey) // only dimensions with analysis data
    .map((dim) => {
      const raw = breakdown[dim.breakdownKey] ?? 0;
      const max = dim.maxScore;
      const clamped = Math.max(0, Math.min(raw, max));
      const pct = max > 0 ? Math.round((clamped / max) * 100) : 0;
      const analysisDim = dim.analysisKey ? analysis?.[dim.analysisKey] : undefined;

      return {
        key: dim.analysisKey!,
        label: dim.label,
        score: clamped,
        maxScore: max,
        percent: pct,
        isBarrier: analysisDim?.is_barrier ?? false,
        priority: analysisDim?.priority ?? 'baixa',
      };
    });
}

function parseInsights(row: {
  formatted_report: string | null;
  readiness_score: number | null;
  phase_name: string | null;
  rota_letter: string | null;
  lead_temperature: string | null;
  access_token: string | null;
}): CareerInsights {
  if (!row.formatted_report) {
    return { ...EMPTY_INSIGHTS, reportToken: row.access_token };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(row.formatted_report);
  } catch {
    return { ...EMPTY_INSIGHTS, reportToken: row.access_token };
  }

  if (!isV2Report(parsed)) {
    return { ...EMPTY_INSIGHTS, hasReport: true, reportToken: row.access_token };
  }

  const data = parsed as V2FormattedReportData;
  const dimensions = buildDimensions(data);
  const sorted = [...dimensions].sort((a, b) => a.percent - b.percent);
  const weakest = sorted[0] ?? null;
  const strongest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  return {
    hasReport: true,
    score: row.readiness_score ?? data.scoring?.readiness_score ?? 0,
    phase: data.phase_classification
      ? {
          name: data.phase_classification.phase_name,
          emoji: data.phase_classification.phase_emoji,
          letter: data.phase_classification.rota_letter,
          color: data.phase_classification.phase_color,
        }
      : null,
    temperature: row.lead_temperature ?? data.lead_qualification?.lead_temperature ?? null,
    shortDiagnosis: data.phase_classification?.short_diagnosis ?? null,
    dimensions: sorted,
    weakest,
    strongest,
    criticalGaps: data.web_report_data?.key_metrics?.critical_gaps ?? [],
    strengths: data.web_report_data?.key_metrics?.strengths ?? [],
    recommendedFirstAction: data.barriers_analysis?.recommended_first_action ?? null,
    reportToken: row.access_token,
  };
}

export function useCareerInsights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['career-insights', user?.id],
    queryFn: async (): Promise<CareerInsights> => {
      if (!user?.id) return EMPTY_INSIGHTS;

      const { data, error } = await supabase
        .from('career_evaluations')
        .select('formatted_report, readiness_score, phase_name, rota_letter, lead_temperature, access_token')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return EMPTY_INSIGHTS;

      return parseInsights(data);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
