import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useInView } from '@/hooks/useInView';
import type { V2ScoreBreakdown as V2ScoreBreakdownType, V2DetailedAnalysis } from '@/types/leads';

interface V2ScoreBreakdownProps {
  breakdown: V2ScoreBreakdownType;
  analysis?: V2DetailedAnalysis;
}

const dimensionConfig: {
  key: keyof V2ScoreBreakdownType;
  analysisKey?: keyof V2DetailedAnalysis;
  label: string;
  maxScore: number;
}[] = [
  { key: 'score_english', analysisKey: 'english', label: 'Inglês', maxScore: 25 },
  { key: 'score_experience', analysisKey: 'experience', label: 'Experiência', maxScore: 20 },
  { key: 'score_international_work', label: 'Trabalho Internacional', maxScore: 10 },
  { key: 'score_timeline', analysisKey: 'timeline', label: 'Timeline', maxScore: 10 },
  { key: 'score_objective', analysisKey: 'objective', label: 'Objetivo', maxScore: 10 },
  { key: 'score_visa', analysisKey: 'visa_immigration', label: 'Visto', maxScore: 10 },
  { key: 'score_readiness', analysisKey: 'mental_readiness', label: 'Prontidão Mental', maxScore: 10 },
  { key: 'score_area_bonus', label: 'Bônus Área', maxScore: 5 },
];

function getBarColor(pct: number): string {
  if (pct >= 70) return 'bg-green-500';
  if (pct >= 40) return 'bg-blue-500';
  return 'bg-amber-400';
}

function getStatusBadge(analysisKey: keyof V2DetailedAnalysis | undefined, analysis: V2DetailedAnalysis | undefined, pct: number) {
  if (!analysisKey || !analysis) {
    // Fallback to percentage-based badge
    if (pct >= 70) return <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-[10px] font-bold px-2 py-0.5">Bom</Badge>;
    if (pct < 40) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5">Atenção</Badge>;
    return null;
  }
  const dim = analysis[analysisKey];
  if (!dim) return null;

  const priority = dim.priority?.toLowerCase();

  if (dim.is_barrier && (priority === 'critica' || priority === 'alta')) {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-[10px] font-bold px-2 py-0.5">Bloqueador</Badge>;
  }
  if (dim.is_barrier && priority === 'media') {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5">Atenção</Badge>;
  }
  if (dim.is_barrier) {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5">Atenção</Badge>;
  }
  if (pct >= 70) {
    return <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-[10px] font-bold px-2 py-0.5">Bom</Badge>;
  }
  return null;
}

export function V2ScoreBreakdown({ breakdown, analysis }: V2ScoreBreakdownProps) {
  const { ref, isInView } = useInView();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Pontuação por dimensão</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cada área tem um peso diferente no seu score final de prontidão.
        </p>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-4 sm:p-5 md:p-8" ref={ref}>
          <div className="space-y-4">
            {dimensionConfig.map(({ key, analysisKey, label, maxScore }, index) => {
              const value = breakdown[key];
              const pct = Math.min((value / maxScore) * 100, 100);
              const badge = getStatusBadge(analysisKey, analysis, pct);

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{label}</span>
                      {badge}
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                      {value}/{maxScore}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor(pct)} transition-all ease-out`}
                      style={{
                        width: isInView ? `${pct}%` : '0%',
                        transitionDuration: '800ms',
                        transitionDelay: `${index * 80}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
