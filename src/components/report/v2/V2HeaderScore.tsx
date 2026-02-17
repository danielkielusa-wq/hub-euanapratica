import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { V2Scoring, V2PhaseClassification, V2HeroSection } from '@/types/leads';

interface V2HeaderScoreProps {
  scoring: V2Scoring;
  phase: V2PhaseClassification;
  hero: V2HeroSection;
}

export function V2HeaderScore({ scoring, phase, hero }: V2HeaderScoreProps) {
  const { strokeColor, bgColor, textColor } = useMemo(() => {
    const pct = scoring.readiness_percentual;
    if (pct >= 75) return { strokeColor: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', textColor: 'text-green-600' };
    if (pct >= 50) return { strokeColor: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', textColor: 'text-amber-600' };
    return { strokeColor: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', textColor: 'text-red-600' };
  }, [scoring.readiness_percentual]);

  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (scoring.readiness_percentual / 100) * circumference;
  const offset = circumference - progress;

  return (
    <Card className="rounded-[40px] overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-br from-[#2563EB]/10 via-[#1e3a8a]/5 to-transparent p-8 md:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
              {hero.headline}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {hero.subheadline}
            </p>

            {/* Phase Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold"
              style={{ backgroundColor: phase.phase_color }}>
              <span>{phase.phase_emoji}</span>
              <span>{phase.phase_name}</span>
            </div>
          </div>

          {/* Right: Circular Score */}
          <div className="relative inline-flex items-center justify-center shrink-0">
            <div
              className="absolute rounded-full"
              style={{
                width: size + 40,
                height: size + 40,
                backgroundColor: bgColor,
              }}
            />

            <svg
              width={size}
              height={size}
              className="transform -rotate-90 relative z-10"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="white"
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
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span className={`text-4xl md:text-5xl font-black ${textColor}`}>
                {scoring.readiness_percentual}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                Readiness Score
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {scoring.readiness_score}/{scoring.max_score}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
