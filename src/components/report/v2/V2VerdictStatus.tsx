import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import type { V2PhaseClassification, V2BarriersAnalysis } from '@/types/leads';

interface V2VerdictStatusProps {
  phase: V2PhaseClassification;
  barriers: V2BarriersAnalysis;
}

export function V2VerdictStatus({ phase, barriers }: V2VerdictStatusProps) {
  return (
    <Card className="rounded-[32px] shadow-sm">
      <CardContent className="p-8 space-y-6">
        {/* Can Apply Status */}
        <div className="flex items-center gap-3">
          {phase.can_apply_jobs ? (
            <CheckCircle2 className="w-7 h-7 text-green-500 shrink-0" />
          ) : (
            <XCircle className="w-7 h-7 text-red-500 shrink-0" />
          )}
          <span className="font-bold text-lg text-foreground">
            {phase.can_apply_jobs
              ? 'Pode aplicar para vagas internacionais'
              : 'Ainda nao esta pronto para aplicar'}
          </span>
        </div>

        {/* Short Diagnosis */}
        <p className="text-muted-foreground leading-relaxed">
          {phase.short_diagnosis}
        </p>

        {/* Critical Blockers */}
        {barriers.critical_blockers.length > 0 && (
          <div className="rounded-[20px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wide">Bloqueios Criticos</span>
            </div>
            <ul className="space-y-2">
              {barriers.critical_blockers.map((blocker, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {blocker}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended First Action */}
        {barriers.recommended_first_action && (
          <div className="rounded-[20px] border-l-4 border-[#2563EB] bg-blue-50 dark:bg-blue-950/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-4 h-4 text-[#2563EB]" />
              <span className="font-bold text-sm text-[#2563EB] uppercase tracking-wide">Proxima Acao Recomendada</span>
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
