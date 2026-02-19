import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useInView } from '@/hooks/useInView';
import type { V2ScoreBreakdown as V2ScoreBreakdownType, V2DetailedAnalysis } from '@/types/leads';
import { BREAKDOWN_DIMENSIONS, clampScore, getScorePercent, getBarColor, getScoreLabel } from './scoring';

interface V2ScoreBreakdownProps {
  breakdown: V2ScoreBreakdownType;
  analysis?: V2DetailedAnalysis;
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
            {BREAKDOWN_DIMENSIONS.map(({ breakdownKey, analysisKey, label, maxScore }, index) => {
              const value = clampScore(breakdown[breakdownKey], maxScore);
              const pct = getScorePercent(value, maxScore);
              const dim = analysisKey && analysis?.[analysisKey];
              const badge = getScoreLabel(pct, dim || undefined);

              return (
                <div key={breakdownKey} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{label}</span>
                      {badge && (
                        <Badge className={`text-[10px] font-bold px-2 py-0.5 ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      )}
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
