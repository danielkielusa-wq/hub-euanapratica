import { Target, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useInView } from '@/hooks/useInView';
import type { V2BarriersAnalysis } from '@/types/leads';

interface V2CriticalBlockersProps {
  barriers: V2BarriersAnalysis;
}

export function V2CriticalBlockers({ barriers }: V2CriticalBlockersProps) {
  const { ref, isInView } = useInView();
  const blockers = barriers.critical_blockers;

  if (!blockers || blockers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-bold text-foreground">Áreas de Foco Prioritário</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Trabalhe nessas {blockers.length} áreas primeiro para acelerar seus resultados. Nossa mentoria vai te guiar em cada uma.
      </p>

      <div ref={ref} className="space-y-3">
        {blockers.map((blocker, index) => (
          <Card
            key={index}
            className="rounded-2xl border-l-4 border-l-blue-400 shadow-sm transition-all duration-500 ease-out hover:shadow-md"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground">{blocker}</h3>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5">
                      {index < 2 ? 'Prioritário' : 'Importante'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {barriers.recommended_first_action && (
        <Card className="rounded-2xl border-l-4 border-l-green-400 bg-green-50/50 dark:bg-green-950/10">
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                Comece por aqui
              </p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {barriers.recommended_first_action}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
