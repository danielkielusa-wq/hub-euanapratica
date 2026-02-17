import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import type { V2KeyMetrics } from '@/types/leads';

interface V2StrengthsGapsProps {
  metrics: V2KeyMetrics;
}

export function V2StrengthsGaps({ metrics }: V2StrengthsGapsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#2563EB]" />
        Forcas e Gaps
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="rounded-[24px] border border-green-100 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 shadow-sm">
          <CardContent className="p-5 md:p-6">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-green-600 dark:text-green-400 mb-4">
              Pontos Fortes
            </h4>
            {metrics.strengths.length > 0 ? (
              <ul className="space-y-3">
                {metrics.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum ponto forte identificado.</p>
            )}
          </CardContent>
        </Card>

        {/* Critical Gaps */}
        <Card className="rounded-[24px] border border-amber-100 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-5 md:p-6">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400 mb-4">
              Gaps Criticos
            </h4>
            {metrics.critical_gaps.length > 0 ? (
              <ul className="space-y-3">
                {metrics.critical_gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{gap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum gap critico identificado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary row */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border">
          <span className="text-sm text-muted-foreground">Estimativa:</span>
          <span className="text-sm font-bold text-foreground">
            {metrics.estimated_timeline_months} meses
          </span>
        </div>
        <Badge
          className={`text-xs font-bold px-4 py-1.5 ${
            metrics.can_start_applying
              ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
          }`}
        >
          {metrics.can_start_applying ? 'Pode comecar a aplicar' : 'Precisa preparar primeiro'}
        </Badge>
      </div>
    </div>
  );
}
