import { Card, CardContent } from '@/components/ui/card';
import { Languages, Briefcase, Target, DollarSign } from 'lucide-react';

interface DiagnosticGridProps {
  diagnostic: {
    english: { level: string; description: string };
    experience: { summary: string; details: string };
    objective: { goal: string; timeline: string };
    financial: { income: string; investment: string };
  };
}

const diagnosticConfig = [
  {
    key: 'english' as const,
    icon: Languages,
    label: 'Inglês',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-100 dark:border-blue-900/50',
    getValue: (d: DiagnosticGridProps['diagnostic']) => d.english.level,
    getDescription: (d: DiagnosticGridProps['diagnostic']) => d.english.description,
  },
  {
    key: 'experience' as const,
    icon: Briefcase,
    label: 'Experiência',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    iconColor: 'text-indigo-500',
    borderColor: 'border-indigo-100 dark:border-indigo-900/50',
    getValue: (d: DiagnosticGridProps['diagnostic']) => d.experience.summary,
    getDescription: (d: DiagnosticGridProps['diagnostic']) => d.experience.details,
  },
  {
    key: 'objective' as const,
    icon: Target,
    label: 'Objetivo',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-100 dark:border-purple-900/50',
    getValue: (d: DiagnosticGridProps['diagnostic']) => d.objective.goal,
    getDescription: (d: DiagnosticGridProps['diagnostic']) => d.objective.timeline,
  },
  {
    key: 'financial' as const,
    icon: DollarSign,
    label: 'Financeiro',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-500',
    borderColor: 'border-amber-100 dark:border-amber-900/50',
    getValue: (d: DiagnosticGridProps['diagnostic']) => d.financial.income,
    getDescription: (d: DiagnosticGridProps['diagnostic']) => d.financial.investment,
  },
];

export function DiagnosticGrid({ diagnostic }: DiagnosticGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        📊 Diagnóstico de Prontidão
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {diagnosticConfig.map((item) => {
          const Icon = item.icon;
          return (
            <Card 
              key={item.key} 
              className={`rounded-[24px] border ${item.borderColor} ${item.bgColor} shadow-sm hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm`}>
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                      {item.label}
                    </p>
                    <p className="font-bold text-foreground text-base truncate">
                      {item.getValue(diagnostic)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.getDescription(diagnostic)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
