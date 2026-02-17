import { ReportHeader } from '../ReportHeader';
import { V2HeaderScore } from './V2HeaderScore';
import { V2VerdictStatus } from './V2VerdictStatus';
import { V2ScoreBreakdown } from './V2ScoreBreakdown';
import { V2DetailedAnalysis } from './V2DetailedAnalysis';
import { V2ActionPlan } from './V2ActionPlan';
import { V2RotaProgress } from './V2RotaProgress';
import { V2StrengthsGaps } from './V2StrengthsGaps';
import { V2ProductRecommendation } from './V2ProductRecommendation';
import { V2ResourcesList } from './V2ResourcesList';
import { V2ReportFooter } from './V2ReportFooter';
import type { V2FormattedReportData } from '@/types/leads';

interface V2ReportContainerProps {
  data: V2FormattedReportData;
}

export function V2ReportContainer({ data }: V2ReportContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background print:bg-white">
      <ReportHeader />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:space-y-6">
        {/* Section 1: Header & Score */}
        <V2HeaderScore
          scoring={data.scoring}
          phase={data.phase_classification}
          hero={data.web_report_data.hero_section}
        />

        {/* Section 2: Verdict & Status */}
        <V2VerdictStatus
          phase={data.phase_classification}
          barriers={data.barriers_analysis}
        />

        {/* Section 3: Score Breakdown */}
        <V2ScoreBreakdown
          breakdown={data.scoring.score_breakdown}
        />

        {/* Section 4: Detailed Analysis */}
        <V2DetailedAnalysis
          analysis={data.detailed_analysis}
          barriers={data.barriers_analysis}
        />

        {/* Section 5: Action Plan (30d / 90d / 6m) */}
        <V2ActionPlan
          actionPlan={data.action_plan}
        />

        {/* Section 6: ROTA Framework Progress */}
        <V2RotaProgress
          progress={data.web_report_data.rota_framework_progress}
        />

        {/* Section 7: Strengths & Gaps */}
        <V2StrengthsGaps
          metrics={data.web_report_data.key_metrics}
        />

        {/* Section 8: Product Recommendation */}
        {data.product_recommendation && (
          <V2ProductRecommendation
            recommendation={data.product_recommendation}
          />
        )}

        {/* Section 9: Resources */}
        <V2ResourcesList
          resources={data.web_report_data.resources}
        />

        {/* Section 10: Footer */}
        <V2ReportFooter
          userName={data.user_data.name}
          generatedAt={data.report_metadata.generated_at}
          reportVersion={data.report_metadata.report_version}
        />
      </main>
    </div>
  );
}
