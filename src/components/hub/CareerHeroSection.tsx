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

const TEMP_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Flame }> = {
  'muito-quente': { label: 'Muito Quente', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: Flame },
  quente: { label: 'Quente', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: Flame },
  morno: { label: 'Morno', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Sun },
  frio: { label: 'Frio', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Snowflake },
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color || '#6366f1'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-gray-900">{score}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

export function CareerHeroSection({ config, insights, planName, userName }: CareerHeroSectionProps) {
  const hasReport = insights?.hasReport ?? false;
  const greeting = getGreeting(config, userName, hasReport);

  // No report: simple greeting
  if (!hasReport || !insights) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Seu Hub</h1>
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
            Plano {planName}
          </span>
        </div>
        <p className="text-gray-500">{greeting}</p>
      </div>
    );
  }

  // With report: score ring + phase + diagnosis
  const temp = insights.temperature ? TEMP_CONFIG[insights.temperature] : null;
  const TempIcon = temp?.icon ?? Zap;
  const ringColor = insights.phase?.color || '#6366f1';

  return (
    <div className="mb-10">
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Score ring */}
          <ScoreRing score={insights.score} color={ringColor} />

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <p className="text-gray-500 text-sm">{greeting}</p>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                Plano {planName}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2">
              Prontidão: {insights.score}/100
            </h1>

            <div className="flex items-center gap-3 flex-wrap mb-3">
              {/* Phase badge */}
              {insights.phase && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: `${insights.phase.color}15`,
                    borderColor: `${insights.phase.color}40`,
                    color: insights.phase.color,
                  }}
                >
                  {insights.phase.emoji} {insights.phase.name}
                </span>
              )}

              {/* Temperature badge */}
              {temp && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${temp.bg} ${temp.color}`}>
                  <TempIcon size={12} />
                  {temp.label}
                </span>
              )}
            </div>

            {/* Short diagnosis */}
            {insights.shortDiagnosis && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                {insights.shortDiagnosis}
              </p>
            )}

            {/* CTA to full report */}
            {insights.reportToken && (
              <Link
                to={`/report/${insights.reportToken}`}
                className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:gap-3 transition-all"
              >
                Ver Relatório Completo <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
