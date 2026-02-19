import { ReportHeader } from '../ReportHeader';
import { V2HeaderScore } from './V2HeaderScore';
import { V2ScoreBreakdown } from './V2ScoreBreakdown';
import { V2RotaProgress } from './V2RotaProgress';
import { V2CriticalBlockers } from './V2CriticalBlockers';
import { V2StrengthsGaps } from './V2StrengthsGaps';
import { V2DetailedAnalysis } from './V2DetailedAnalysis';
import { V2ActionPlan } from './V2ActionPlan';
import { V2Checkpoints } from './V2Checkpoints';
import { V2CTAFinal } from './V2CTAFinal';
import { V2ReportFooter } from './V2ReportFooter';
import { ScrollReveal } from './ScrollReveal';
import type { V2FormattedReportData, CareerEvaluation } from '@/types/leads';

interface V2ReportContainerProps {
  data: V2FormattedReportData;
  evaluation: CareerEvaluation;
}

export function V2ReportContainer({ data, evaluation }: V2ReportContainerProps) {
  // Extract current phase letter from rota_letter (handles cases like "O-T" → "T")
  const extractPhaseLetter = (rotaLetter: string | undefined): string => {
    if (!rotaLetter) return 'R'; // Default to R if not defined
    // If it's a transition like "O-T", take the target phase (last letter)
    const parts = rotaLetter.split('-');
    return parts[parts.length - 1].trim();
  };

  const currentPhase = extractPhaseLetter(
    data.phase_classification?.rota_letter || data.web_report_data.rota_framework_progress?.current_phase
  );

  const rotaProgress = {
    ...data.web_report_data.rota_framework_progress,
    current_phase: currentPhase
  };

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <ReportHeader />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 md:space-y-10 print:space-y-6">
        {/* 1. Hero + Score + Profile Chips */}
        <V2HeaderScore
          scoring={data.scoring}
          phase={data.phase_classification}
          hero={data.web_report_data.hero_section}
          evaluation={evaluation}
        />

        {/* 2. Pontuação por dimensão */}
        <ScrollReveal>
          <V2ScoreBreakdown
            breakdown={data.scoring.score_breakdown}
            analysis={data.detailed_analysis}
          />
        </ScrollReveal>

        {/* 3. Jornada ROTA */}
        <ScrollReveal>
          <V2RotaProgress
            progress={rotaProgress}
          />
        </ScrollReveal>

        {/* 4. Bloqueadores críticos */}
        <ScrollReveal>
          <V2CriticalBlockers
            barriers={data.barriers_analysis}
          />
        </ScrollReveal>

        {/* 5. Forças e gaps */}
        <ScrollReveal>
          <V2StrengthsGaps
            metrics={data.web_report_data.key_metrics}
          />
        </ScrollReveal>

        {/* 6. Análise detalhada (accordion) */}
        <ScrollReveal>
          <V2DetailedAnalysis
            analysis={data.detailed_analysis}
            breakdown={data.scoring.score_breakdown}
          />
        </ScrollReveal>

        {/* 7. Plano de ação */}
        <ScrollReveal>
          <V2ActionPlan
            actionPlan={data.action_plan}
          />
        </ScrollReveal>

        {/* 8. Próximos checkpoints */}
        {data.timeline_milestones && (
          <ScrollReveal>
            <V2Checkpoints
              milestones={data.timeline_milestones}
            />
          </ScrollReveal>
        )}

        {/* 9. CTA Final + Explorer invite */}
        <ScrollReveal>
          <V2CTAFinal
            userName={evaluation.name}
            recommendation={data.product_recommendation}
            llmRecommendation={evaluation.recommendation_status === 'completed' ? {
              productName: evaluation.recommended_product_name,
              description: evaluation.recommendation_description,
              landingPageUrl: evaluation.recommendation_landing_page_url,
            } : undefined}
          />
        </ScrollReveal>

        {/* 10. Footer */}
        <V2ReportFooter
          userName={evaluation.name}
          generatedAt={data.report_metadata?.generated_at || evaluation.formatted_at || evaluation.created_at}
          reportVersion={data.report_metadata?.report_version || '2.0'}
        />
      </main>
    </div>
  );
}
