import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Target, Rocket, ArrowRight } from 'lucide-react';
import type { V2PhaseClassification, V2BarriersAnalysis } from '@/types/leads';

interface V2VerdictStatusProps {
  phase: V2PhaseClassification;
  barriers: V2BarriersAnalysis;
}

export function V2VerdictStatus({ phase, barriers }: V2VerdictStatusProps) {
  return (
    <Card className="rounded-[32px] shadow-sm">
      <CardContent className="p-8 space-y-6">
        {/* Can Apply Status - Always positive framing */}
        <div className="flex items-center gap-3">
          {phase.can_apply_jobs ? (
            <CheckCircle2 className="w-7 h-7 text-green-500 shrink-0" />
          ) : (
            <Rocket className="w-7 h-7 text-blue-500 shrink-0" />
          )}
          <span className="font-bold text-lg text-foreground">
            {phase.can_apply_jobs
              ? 'Você está pronto para aplicar internacionalmente'
              : 'Você está no caminho certo para aplicar internacionalmente'}
          </span>
        </div>

        {/* Short Diagnosis */}
        <p className="text-muted-foreground leading-relaxed">
          {phase.short_diagnosis}
        </p>

        {/* Areas to develop - Positive framing */}
        {barriers.critical_blockers.length > 0 && (
          <div className="rounded-[20px] bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Target className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wide">Áreas de Crescimento</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Nossa mentoria vai te ajudar a desenvolver essas competências:
            </p>
            <ul className="space-y-2">
              {barriers.critical_blockers.map((blocker, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {blocker}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended First Action */}
        {barriers.recommended_first_action && (
          <div className="rounded-[20px] border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-4 h-4 text-green-600" />
              <span className="font-bold text-sm text-green-600 dark:text-green-400 uppercase tracking-wide">Seu Próximo Passo</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {barriers.recommended_first_action}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
