import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CalendarDays, Calendar } from 'lucide-react';
import type { V2ActionPlan as V2ActionPlanType, V2ActionPlanStep } from '@/types/leads';

interface V2ActionPlanProps {
  actionPlan: V2ActionPlanType;
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
};

function StepCard({ step, showHours }: { step: V2ActionPlanStep; showHours?: boolean }) {
  const priorityClass = priorityColors[step.priority?.toLowerCase()] || priorityColors.medium;

  return (
    <Card className="rounded-[24px] border border-border/50 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5 md:p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold text-lg">{step.step_number}</span>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground text-base md:text-lg">
                {step.title}
              </h4>
              <Badge className={`text-[9px] uppercase font-bold shrink-0 ${priorityClass}`}>
                {step.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              {showHours && step.estimated_hours_week != null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{step.estimated_hours_week}h/semana</span>
                </div>
              )}
              {step.milestone && (
                <div className="flex items-center gap-1 text-xs text-[#2563EB]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="font-medium">{step.milestone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function V2ActionPlan({ actionPlan }: V2ActionPlanProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-500" />
        Plano de Acao
      </h3>

      <Tabs defaultValue="30d" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-[16px] h-auto p-1">
          <TabsTrigger value="30d" className="rounded-[12px] text-xs md:text-sm py-2.5">
            30 dias
          </TabsTrigger>
          <TabsTrigger value="90d" className="rounded-[12px] text-xs md:text-sm py-2.5">
            90 dias
          </TabsTrigger>
          <TabsTrigger value="6m" className="rounded-[12px] text-xs md:text-sm py-2.5">
            6 meses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="30d" className="mt-4 space-y-4">
          {actionPlan.next_30_days.map((step) => (
            <StepCard key={step.step_number} step={step} showHours />
          ))}
          {actionPlan.next_30_days.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma acao definida para este periodo.</p>
          )}
        </TabsContent>

        <TabsContent value="90d" className="mt-4 space-y-4">
          {actionPlan.next_90_days.map((step) => (
            <StepCard key={step.step_number} step={step} />
          ))}
          {actionPlan.next_90_days.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma acao definida para este periodo.</p>
          )}
        </TabsContent>

        <TabsContent value="6m" className="mt-4 space-y-4">
          {actionPlan.next_6_months.map((step) => (
            <StepCard key={step.step_number} step={step} />
          ))}
          {actionPlan.next_6_months.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma acao definida para este periodo.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
