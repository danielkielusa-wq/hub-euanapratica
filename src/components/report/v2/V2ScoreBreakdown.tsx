import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { V2ScoreBreakdown as V2ScoreBreakdownType } from '@/types/leads';

interface V2ScoreBreakdownProps {
  breakdown: V2ScoreBreakdownType;
}

const dimensionConfig: { key: keyof V2ScoreBreakdownType; label: string; maxScore: number }[] = [
  { key: 'score_english', label: 'Ingles', maxScore: 25 },
  { key: 'score_experience', label: 'Experiencia', maxScore: 20 },
  { key: 'score_international_work', label: 'Trabalho Internacional', maxScore: 15 },
  { key: 'score_timeline', label: 'Timeline', maxScore: 10 },
  { key: 'score_objective', label: 'Objetivo', maxScore: 10 },
  { key: 'score_visa', label: 'Visto', maxScore: 10 },
  { key: 'score_readiness', label: 'Prontidao', maxScore: 5 },
  { key: 'score_area_bonus', label: 'Bonus de Area', maxScore: 5 },
];

export function V2ScoreBreakdown({ breakdown }: V2ScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[#2563EB]" />
        Detalhamento do Score
      </h3>

      <Card className="rounded-[32px] shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {dimensionConfig.map(({ key, label, maxScore }) => {
              const value = breakdown[key];
              const pct = Math.min((value / maxScore) * 100, 100);

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-sm font-bold text-foreground">
                      {value}/{maxScore}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2563EB] transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
