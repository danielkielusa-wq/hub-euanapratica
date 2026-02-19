import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Briefcase, Clock, Target, Globe } from 'lucide-react';
import type { V2Scoring, V2PhaseClassification, V2HeroSection, CareerEvaluation } from '@/types/leads';

interface V2HeaderScoreProps {
  scoring: V2Scoring;
  phase: V2PhaseClassification;
  hero: V2HeroSection;
  evaluation: CareerEvaluation;
}

export function V2HeaderScore({ scoring, phase, hero, evaluation }: V2HeaderScoreProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const clampedPct = Math.max(0, Math.min(scoring.readiness_percentual, 100));
  const clampedScore = Math.max(0, Math.min(scoring.readiness_score, scoring.max_score));

  const { strokeColor, textColor } = useMemo(() => {
    if (clampedPct >= 70) return { strokeColor: '#22c55e', textColor: 'text-green-600' };
    if (clampedPct >= 40) return { strokeColor: '#3b82f6', textColor: 'text-blue-600' };
    return { strokeColor: '#f59e0b', textColor: 'text-amber-500' };
  }, [clampedPct]);

  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (clampedPct / 100) * circumference;

  const profileChips = useMemo(() => {
    const chips: { icon: typeof Briefcase; label: string; value: string }[] = [];
    if (evaluation.area || evaluation.atuacao) {
      chips.push({ icon: Briefcase, label: 'Área', value: evaluation.area || evaluation.atuacao || '' });
    }
    if (evaluation.experiencia) {
      chips.push({ icon: Clock, label: 'Experiência', value: evaluation.experiencia });
    }
    if (evaluation.objetivo) {
      chips.push({ icon: Target, label: 'Objetivo', value: evaluation.objetivo });
    }
    if (evaluation.timeline) {
      chips.push({ icon: Globe, label: 'Emprego', value: evaluation.timeline });
    }
    return chips;
  }, [evaluation]);

  return (
    <Card className="rounded-3xl overflow-hidden border-0 shadow-lg">
      <div className="p-4 sm:p-6 md:p-10">
        {/* Phase badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
          style={{ backgroundColor: `${phase.phase_color}18`, color: phase.phase_color }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.phase_color }} />
          Prontidão: {phase.phase_name}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 md:gap-10">
          {/* Left: Headline */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-[2rem] font-black text-foreground leading-tight tracking-tight">
              {hero.headline}
            </h1>
            <p className="mt-3 text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
              {hero.subheadline}
            </p>
          </div>

          {/* Right: Circular score */}
          <div className="relative inline-flex items-center justify-center shrink-0 self-center">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="hsl(var(--border))"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={animated ? targetOffset : circumference}
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl sm:text-3xl md:text-4xl font-black ${textColor}`}>
                {clampedScore}
              </span>
              <span className="text-xs text-muted-foreground">
                de {scoring.max_score} pontos
              </span>
            </div>
          </div>
        </div>

        {/* Profile chips */}
        {profileChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border/40">
            {profileChips.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs"
              >
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
