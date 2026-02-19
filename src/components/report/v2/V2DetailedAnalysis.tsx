import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useInView } from '@/hooks/useInView';
import type {
  V2DetailedAnalysis as V2DetailedAnalysisType,
  V2ScoreBreakdown,
  V2AnalysisDimension,
} from '@/types/leads';

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

const dimensionMapping: {
  analysisKey: keyof V2DetailedAnalysisType;
  breakdownKey: keyof V2ScoreBreakdown;
  label: string;
  maxScore: number;
}[] = [
  { analysisKey: 'english', breakdownKey: 'score_english', label: 'Inglês', maxScore: 25 },
  { analysisKey: 'visa_immigration', breakdownKey: 'score_visa', label: 'Visto', maxScore: 10 },
  { analysisKey: 'mental_readiness', breakdownKey: 'score_readiness', label: 'Prontidão Mental', maxScore: 5 },
  { analysisKey: 'experience', breakdownKey: 'score_experience', label: 'Experiência', maxScore: 20 },
  { analysisKey: 'objective', breakdownKey: 'score_objective', label: 'Objetivo', maxScore: 10 },
  { analysisKey: 'timeline', breakdownKey: 'score_timeline', label: 'Timeline', maxScore: 10 },
];

function getStatusLabel(dim: V2AnalysisDimension, pct: number): { label: string; className: string } {
  if (dim.is_barrier && dim.priority?.toLowerCase() === 'high') {
    return { label: 'Crítico', className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' };
  }
  if (dim.is_barrier) {
    return { label: 'Atenção', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' };
  }
  if (pct >= 70) {
    return { label: 'Bom', className: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' };
  }
  return { label: 'Normal', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' };
}

function getBarColor(pct: number, isBarrier: boolean): string {
  if (isBarrier) return 'bg-amber-400';
  if (pct >= 70) return 'bg-blue-500';
  return 'bg-blue-400';
}

export function V2DetailedAnalysis({ analysis, breakdown }: V2DetailedAnalysisProps) {
  const { ref, isInView } = useInView();

  const entries: DimensionEntry[] = dimensionMapping
    .map(({ analysisKey, breakdownKey, label, maxScore }) => {
      const dim = analysis[analysisKey];
      if (!dim) return null;
      return {
        key: analysisKey,
        label,
        dimension: dim,
        score: breakdown[breakdownKey],
        maxScore,
      };
    })
    .filter((e): e is DimensionEntry => e !== null)
    .sort((a, b) => {
      const aPriority = a.dimension.is_barrier ? (a.dimension.priority === 'high' ? 0 : 1) : 2;
      const bPriority = b.dimension.is_barrier ? (b.dimension.priority === 'high' ? 0 : 1) : 2;
      return aPriority - bPriority;
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
              const pct = Math.min((score / maxScore) * 100, 100);
              const status = getStatusLabel(dimension, pct);

              return (
                <AccordionItem key={key} value={key} className="border-b border-border/40 last:border-b-0">
                  <AccordionTrigger className="px-3 sm:px-5 md:px-8 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                      <span className="text-sm font-medium text-foreground truncate">{label}</span>
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${status.className}`}>
                        {status.label}
                      </Badge>
                      <div className="flex-1 mx-2 hidden sm:block">
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getBarColor(pct, dimension.is_barrier)} transition-all ease-out`}
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
