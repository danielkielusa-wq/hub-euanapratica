import { Card, CardContent } from '@/components/ui/card';
import { Check, ArrowUpRight } from 'lucide-react';
import type { V2KeyMetrics } from '@/types/leads';

interface V2StrengthsGapsProps {
  metrics: V2KeyMetrics;
}

export function V2StrengthsGaps({ metrics }: V2StrengthsGapsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">Forças e gaps</h2>

      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-4 sm:p-5 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">O que joga a seu favor</h3>
              </div>
              {metrics.strengths.length > 0 ? (
                <ul className="space-y-2.5">
                  {metrics.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <span className="mt-2 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum ponto forte identificado.</p>
              )}
            </div>

            {/* Gaps */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">O que precisa resolver</h3>
              </div>
              {metrics.critical_gaps.length > 0 ? (
                <ul className="space-y-2.5">
                  {metrics.critical_gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                      <span className="mt-2 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum gap crítico identificado.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
