import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Loader2, Lock, Snowflake, Sun, Zap, ClipboardCheck } from 'lucide-react';
import type { CareerInsights, HubDashboardConfig } from '@/types/hub';
import type { CareerAssessmentState } from '@/hooks/useCareerAssessmentStatus';
import { getGreeting } from '@/hooks/useHubDashboardConfig';

interface CareerHeroSectionProps {
  config: HubDashboardConfig;
  insights: CareerInsights | null;
  planName: string;
  userName: string;
  assessmentState: CareerAssessmentState;
  completionPercent: number;
  filledCount: number;
  onOpenAssessment: () => void;
}

const TEMP_CONFIG: Record<string, { label: string; icon: typeof Flame }> = {
  'muito-quente': { label: 'Muito Quente', icon: Flame },
  quente: { label: 'Quente', icon: Flame },
  morno: { label: 'Morno', icon: Sun },
  frio: { label: 'Frio', icon: Snowflake },
};

const CTA_CLASS = 'mt-6 inline-flex items-center gap-2 bg-white text-[#7367F0] text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors';
const CTA_DISABLED_CLASS = 'mt-6 inline-flex items-center gap-2 bg-white/60 text-[#7367F0]/70 text-sm font-bold px-5 py-2.5 rounded-lg cursor-not-allowed';

export function CareerHeroSection({
  config,
  insights,
  planName,
  userName,
  assessmentState,
  completionPercent,
  filledCount,
  onOpenAssessment,
}: CareerHeroSectionProps) {
  const hasReport = insights?.hasReport ?? false;
  const temp = hasReport && insights?.temperature ? TEMP_CONFIG[insights.temperature] : null;
  const TempIcon = temp?.icon ?? Zap;

  // ─── State-dependent content ──────────────────────────────────────────

  let greeting: string;
  let subtitle: string;
  let stat1Value: React.ReactNode;
  let stat1Label: string;
  let stat2Value: React.ReactNode;
  let stat2Label: string;
  let ctaContent: React.ReactNode;

  switch (assessmentState) {
    case 'incomplete_data': {
      greeting = `Ola ${userName}! Complete seu diagnostico para descobrir seu potencial.`;
      subtitle = 'Responda algumas perguntas e receba seu relatorio de prontidao.';
      stat1Value = `${filledCount}/12`;
      stat1Label = 'Dados preenchidos';
      stat2Value = (
        <span className="flex items-center gap-1">
          <ClipboardCheck size={18} />
          Diagnostico
        </span>
      );
      stat2Label = 'Completar agora';
      ctaContent = (
        <button onClick={onOpenAssessment} className={`${CTA_CLASS} relative group`}>
          {/* Animated glow ring */}
          <span className="absolute inset-0 rounded-lg animate-hero-glow" />
          <span className="relative flex items-center gap-2">
            Completar Diagnostico
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </button>
      );
      break;
    }

    case 'generating': {
      greeting = getGreeting(config, userName, false);
      subtitle = 'Estamos analisando seus dados com IA. Isso leva cerca de 2 minutos.';
      stat1Value = <Loader2 className="w-6 h-6 animate-spin" />;
      stat1Label = 'Gerando...';
      stat2Value = '~2 min';
      stat2Label = 'Tempo estimado';
      ctaContent = (
        <span className={CTA_DISABLED_CLASS}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando seu relatorio...
        </span>
      );
      break;
    }

    case 'needs_subscription': {
      greeting = getGreeting(config, userName, true);
      subtitle = 'Seu diagnostico esta pronto! Assine para ver todas as recomendacoes.';
      stat1Value = insights ? `${insights.score}/100` : '—';
      stat1Label = 'Prontidao';
      stat2Value = insights?.phase
        ? <span className="flex items-center gap-1">{insights.phase.emoji} {insights.phase.name}</span>
        : temp
        ? <span className="flex items-center gap-1"><TempIcon size={18} /> {temp.label}</span>
        : '—';
      stat2Label = insights?.phase ? 'Fase Atual' : temp ? 'Temperatura' : '—';
      ctaContent = (
        <div className="flex flex-col gap-2 mt-6">
          <Link to="/pricing" className={CTA_CLASS}>
            <Lock className="w-4 h-4" />
            Desbloquear Relatorio Completo
          </Link>
          {insights?.reportToken && (
            <Link
              to={`/report/${insights.reportToken}`}
              className="text-xs text-indigo-200 hover:text-white underline underline-offset-2 transition-colors"
            >
              Ver versao limitada
            </Link>
          )}
        </div>
      );
      break;
    }

    case 'full_access':
    default: {
      greeting = getGreeting(config, userName, hasReport);
      subtitle = hasReport && insights
        ? (insights.shortDiagnosis || `Voce esta na fase ${insights.phase?.name || 'inicial'} da sua jornada.`)
        : `Voce esta no plano ${planName}. Explore suas ferramentas!`;
      stat1Value = hasReport && insights ? `${insights.score}/100` : planName;
      stat1Label = hasReport ? 'Prontidao' : 'Seu Plano';
      stat2Value = hasReport && insights?.phase
        ? <span className="flex items-center gap-1">{insights.phase.emoji} {insights.phase.name}</span>
        : hasReport && temp
        ? <span className="flex items-center gap-1"><TempIcon size={18} /> {temp.label}</span>
        : 'Diagnostico';
      stat2Label = hasReport && insights?.phase
        ? 'Fase Atual'
        : hasReport && temp
        ? 'Temperatura'
        : 'Comecar agora';

      if (hasReport && insights?.reportToken) {
        ctaContent = (
          <Link to={`/report/${insights.reportToken}`} className={CTA_CLASS}>
            Ver Relatorio Completo
            <ArrowRight className="w-4 h-4" />
          </Link>
        );
      } else {
        ctaContent = (
          <Link to="/curriculo" className={CTA_CLASS}>
            Explorar Ferramentas
            <ArrowRight className="w-4 h-4" />
          </Link>
        );
      }
      break;
    }
  }

  return (
    <div className="bg-[#7367F0] rounded-xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
      <div className="relative z-10">
        <h2 className="text-xl font-bold mb-1">{greeting}</h2>
        <p className="text-indigo-100 text-sm mb-6 max-w-xs">{subtitle}</p>

        <div className="flex gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[100px]">
            <div className="text-2xl font-bold mb-1">{stat1Value}</div>
            <div className="text-xs text-indigo-100">{stat1Label}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[100px]">
            <div className="text-2xl font-bold mb-1 flex items-center gap-1">
              {stat2Value}
            </div>
            <div className="text-xs text-indigo-100">{stat2Label}</div>
          </div>
        </div>

        {ctaContent}

        {/* Progress bar for incomplete state */}
        {assessmentState === 'incomplete_data' && (
          <div className="mt-4 w-full max-w-xs">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-indigo-200 mt-1">{completionPercent}% completo</p>
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 bottom-0 w-64 h-64 translate-x-10 translate-y-10">
        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full opacity-50 blur-3xl" />
      </div>
      <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
    </div>
  );
}
