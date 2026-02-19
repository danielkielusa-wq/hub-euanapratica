import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useInView } from '@/hooks/useInView';
import type {
  V2DetailedAnalysis as V2DetailedAnalysisType,
  V2ScoreBreakdown,
  V2AnalysisDimension,
} from '@/types/leads';
import { ANALYSIS_DIMENSIONS, clampScore, getScorePercent, getBarColor, getScoreLabel } from './scoring';

interface V2DetailedAnalysisProps {
  analysis: V2DetailedAnalysisType;
  breakdown: V2ScoreBreakdown;
}

interface DimensionEntry {
  key: string;
  label: string;
  dimension: V2AnalysisDimension;
  score: number;
  maxScore: number;
}

export function V2DetailedAnalysis({ analysis, breakdown }: V2DetailedAnalysisProps) {
  const { ref, isInView } = useInView();

  const entries: DimensionEntry[] = ANALYSIS_DIMENSIONS
    .map(({ breakdownKey, analysisKey, label, maxScore }) => {
      const dim = analysisKey ? analysis[analysisKey] : undefined;
      if (!dim) return null;
      return {
        key: analysisKey!,
        label,
        dimension: dim,
        score: clampScore(breakdown[breakdownKey], maxScore),
        maxScore,
      };
    })
    .filter((e): e is DimensionEntry => e !== null)
    .sort((a, b) => {
      // Barriers first, sorted by priority severity
      const priorityRank = (d: V2AnalysisDimension): number => {
        if (!d.is_barrier) return 3;
        const p = d.priority?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ?? '';
        if (p === 'critica' || p === 'alta') return 0;
        if (p === 'media') return 1;
        return 2;
      };
      return priorityRank(a.dimension) - priorityRank(b.dimension);
    });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold text-foreground">Análise detalhada</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em cada dimensão para ver diagnóstico e recomendação.
        </p>
      </div>

      <Card className="rounded-3xl shadow-sm overflow-hidden">
        <CardContent className="p-0" ref={ref}>
          <Accordion type="single" collapsible className="w-full">
            {entries.map(({ key, label, dimension, score, maxScore }, index) => {
              const pct = getScorePercent(score, maxScore);
              const status = getScoreLabel(pct, dimension);

              return (
                <AccordionItem key={key} value={key} className="border-b border-border/40 last:border-b-0">
                  <AccordionTrigger className="px-3 sm:px-5 md:px-8 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                      <span className="text-sm font-medium text-foreground truncate">{label}</span>
                      {status && (
                        <Badge className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${status.className}`}>
                          {status.label}
                        </Badge>
                      )}
                      <div className="flex-1 mx-2 hidden sm:block">
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getBarColor(pct)} transition-all ease-out`}
                            style={{
                              width: isInView ? `${pct}%` : '0%',
                              transitionDuration: '800ms',
                              transitionDelay: `${index * 60}ms`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                        {score}/{maxScore}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-5 md:px-8 pb-4 sm:pb-5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">
                          Nível Atual
                        </p>
                        <p className="text-sm font-semibold text-foreground">{dimension.current_level}</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{dimension.assessment}</p>
                      {dimension.recommendation && (
                        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-100 dark:border-blue-900/30">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mb-1">
                            Recomendação
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">{dimension.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
