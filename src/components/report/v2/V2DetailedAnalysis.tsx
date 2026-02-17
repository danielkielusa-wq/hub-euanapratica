import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Lightbulb } from 'lucide-react';
import type { V2DetailedAnalysis as V2DetailedAnalysisType, V2BarriersAnalysis, V2AnalysisDimension } from '@/types/leads';

interface V2DetailedAnalysisProps {
  analysis: V2DetailedAnalysisType;
  barriers: V2BarriersAnalysis;
}

const barrierDimensionMap: { barrierKey: keyof V2BarriersAnalysis; dimensionKey: keyof V2DetailedAnalysisType; label: string; emoji: string }[] = [
  { barrierKey: 'has_english_barrier', dimensionKey: 'english', label: 'Ingles', emoji: '🗣️' },
  { barrierKey: 'has_experience_barrier', dimensionKey: 'experience', label: 'Experiencia', emoji: '💼' },
  { barrierKey: 'has_financial_barrier', dimensionKey: 'financial_context', label: 'Contexto Financeiro', emoji: '💰' },
  { barrierKey: 'has_family_barrier', dimensionKey: 'family_context', label: 'Contexto Familiar', emoji: '👨‍👩‍👧' },
  { barrierKey: 'has_visa_barrier', dimensionKey: 'visa_immigration', label: 'Visto e Imigracao', emoji: '🛂' },
  { barrierKey: 'has_time_barrier', dimensionKey: 'timeline', label: 'Timeline', emoji: '⏰' },
  { barrierKey: 'has_clarity_barrier', dimensionKey: 'objective', label: 'Objetivo', emoji: '🎯' },
];

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
};

function DimensionCard({ dimension, label, emoji }: { dimension: V2AnalysisDimension; label: string; emoji: string }) {
  const priorityClass = priorityColors[dimension.priority?.toLowerCase()] || priorityColors.medium;

  return (
    <Card className="rounded-[24px] border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <h4 className="font-bold text-foreground">{label}</h4>
          </div>
          <Badge className={`text-[9px] uppercase font-bold ${priorityClass}`}>
            {dimension.priority}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Nivel Atual</p>
          <p className="text-sm font-semibold text-foreground">{dimension.current_level}</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {dimension.assessment}
        </p>

        {dimension.recommendation && (
          <div className="rounded-[16px] bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#2563EB]">Recomendacao</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {dimension.recommendation}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Contribuicao ao score:</span>
          <span className="font-bold">{dimension.score_contribution} pts</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function V2DetailedAnalysis({ analysis, barriers }: V2DetailedAnalysisProps) {
  const visibleDimensions = barrierDimensionMap.filter(({ barrierKey, dimensionKey }) => {
    const barrierActive = barriers[barrierKey] as boolean;
    const dimensionIsBarrier = analysis[dimensionKey]?.is_barrier;
    return barrierActive || dimensionIsBarrier;
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Search className="w-5 h-5 text-[#2563EB]" />
        Analise Detalhada
      </h3>

      <div className="space-y-4">
        {/* Always show mental_readiness */}
        <DimensionCard
          dimension={analysis.mental_readiness}
          label="Prontidao Mental"
          emoji="🧠"
        />

        {/* Conditional barrier dimensions */}
        {visibleDimensions.map(({ dimensionKey, label, emoji }) => (
          <DimensionCard
            key={dimensionKey}
            dimension={analysis[dimensionKey]}
            label={label}
            emoji={emoji}
          />
        ))}

        {visibleDimensions.length === 0 && (
          <Card className="rounded-[24px]">
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma barreira critica identificada nas demais dimensoes.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
