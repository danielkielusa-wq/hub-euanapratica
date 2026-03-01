import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Snowflake, Sun, Zap } from 'lucide-react';
import type { CareerInsights, HubDashboardConfig } from '@/types/hub';
import { getGreeting } from '@/hooks/useHubDashboardConfig';

interface CareerHeroSectionProps {
  config: HubDashboardConfig;
  insights: CareerInsights | null;
  planName: string;
  userName: string;
}

const TEMP_CONFIG: Record<string, { label: string; icon: typeof Flame }> = {
  'muito-quente': { label: 'Muito Quente', icon: Flame },
  quente: { label: 'Quente', icon: Flame },
  morno: { label: 'Morno', icon: Sun },
  frio: { label: 'Frio', icon: Snowflake },
};

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{score}</span>
        <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

export function CareerHeroSection({ config, insights, planName, userName }: CareerHeroSectionProps) {
  const hasReport = insights?.hasReport ?? false;
  const greeting = getGreeting(config, userName, hasReport);

  // No report: simple Vuexy card
  if (!hasReport || !insights) {
    return (
      <div className="bg-card rounded-md shadow-md p-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-xl font-medium text-foreground">Seu Hub</h1>
          <span className="vuexy-badge-primary">
            Plano {planName}
          </span>
        </div>
        <p className="text-[15px] text-muted-foreground">{greeting}</p>
      </div>
    );
  }

  // With report: purple gradient hero like Vuexy "Website Analytics"
  const temp = insights.temperature ? TEMP_CONFIG[insights.temperature] : null;
  const TempIcon = temp?.icon ?? Zap;

  return (
    <div className="relative bg-gradient-to-br from-[#7367f0] to-[#9e95f5] rounded-md shadow-md overflow-hidden p-6 md:p-8">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Score ring */}
        <ScoreRing score={insights.score} />

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <p className="text-white/70 text-sm font-medium">{greeting}</p>
            <span className="px-2.5 py-1 rounded-[4px] bg-white/15 text-white text-[11px] font-medium border border-white/25">
              Plano {planName}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-medium text-white tracking-tight mb-2">
            Prontidão: {insights.score}/100
          </h1>

          <div className="flex items-center gap-3 flex-wrap mb-3">
            {/* Phase badge */}
            {insights.phase && (
              <span className="px-2.5 py-1 rounded-[4px] text-xs font-medium bg-white/15 text-white border border-white/25">
                {insights.phase.emoji} {insights.phase.name}
              </span>
            )}

            {/* Temperature badge */}
            {temp && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-medium bg-white/15 text-white border border-white/25">
                <TempIcon size={12} />
                {temp.label}
              </span>
            )}
          </div>

          {/* Short diagnosis */}
          {insights.shortDiagnosis && (
            <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
              {insights.shortDiagnosis}
            </p>
          )}

          {/* CTA to full report */}
          {insights.reportToken && (
            <Link
              to={`/report/${insights.reportToken}`}
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-white hover:text-white/90 hover:gap-3 transition-all"
            >
              Ver Relatório Completo <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
