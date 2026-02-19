import { useState } from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import type { V2ActionPlan as V2ActionPlanType, V2ActionPlanStep } from '@/types/leads';

interface V2ActionPlanProps {
  actionPlan: V2ActionPlanType;
}

const periods = [
  { key: '30d' as const, label: '30 dias', dataKey: 'next_30_days' as const },
  { key: '90d' as const, label: '90 dias', dataKey: 'next_90_days' as const },
  { key: '6m' as const, label: '6 meses', dataKey: 'next_6_months' as const },
];

function StepItem({ step }: { step: V2ActionPlanStep }) {
  const [checked, setChecked] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setChecked(c => !c)}
      className="flex items-start gap-3 w-full text-left group py-2"
    >
      <div className="mt-0.5 shrink-0">
        {checked ? (
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        ) : (
          <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
        )}
      </div>
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span className="text-xs font-bold text-muted-foreground/50 mt-0.5 tabular-nums shrink-0">
          {step.step_number}.
        </span>
        <span className={`text-sm leading-relaxed transition-colors ${checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {step.title}
        </span>
      </div>
    </button>
  );
}

export function V2ActionPlan({ actionPlan }: V2ActionPlanProps) {
  const [activePeriod, setActivePeriod] = useState<'30d' | '90d' | '6m'>('30d');

  const steps = activePeriod === '30d'
    ? actionPlan.next_30_days
    : activePeriod === '90d'
      ? actionPlan.next_90_days
      : actionPlan.next_6_months;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold text-foreground">Plano de ação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ações priorizadas em 3 horizontes de tempo.
        </p>
      </div>

      {/* Period toggle */}
      <div className="flex gap-1.5 sm:gap-2">
        {periods.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePeriod(key)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-medium transition-all ${
              activePeriod === key
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Steps list with fade animation */}
      <div
        key={activePeriod}
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {steps.length > 0 ? (
          <div className="divide-y divide-border/30">
            {steps.map((step) => (
              <StepItem key={`${activePeriod}-${step.step_number}`} step={step} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma ação definida para este período.
          </p>
        )}
      </div>
    </div>
  );
}
