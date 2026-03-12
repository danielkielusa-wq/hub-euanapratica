import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface EngagementCircleProps {
  percentage: number;
  enrolledCount: number;
  label?: string;
}

export function EngagementCircle({ percentage, enrolledCount, label = 'Engajamento da Turma' }: EngagementCircleProps) {
  const activeCount = Math.round((percentage / 100) * enrolledCount);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (circumference * percentage) / 100;

  const getColor = () => {
    if (percentage >= 70) return 'text-emerald-500';
    if (percentage >= 40) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <Card className="rounded-[20px] border-border/50 w-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">{label}</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px]">
              Porcentagem de presenças registradas em relação ao total de registros de presença do espaço.
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-4 flex-1">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${getColor()} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{percentage}%</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Presença</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          {activeCount} de {enrolledCount} presenças
        </p>
      </CardContent>
    </Card>
  );
}
