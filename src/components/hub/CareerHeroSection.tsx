import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Lock, ClipboardCheck } from 'lucide-react';
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

const TEMP_CONFIG: Record<string, { label: string }> = {
  'muito-quente': { label: 'Muito Quente' },
  quente: { label: 'Quente' },
  morno: { label: 'Morno' },
  frio: { label: 'Frio' },
};

const CTA_CLASS = 'mt-4 sm:mt-6 inline-flex items-center gap-2 bg-white text-[#7367F0] text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors';
const CTA_DISABLED_CLASS = 'mt-4 sm:mt-6 inline-flex items-center gap-2 bg-white/60 text-[#7367F0]/70 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg cursor-not-allowed';

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

  // ─── State-dependent content ──────────────────────────────────────────

  let greeting: string;
  let subtitle: string;
  let stat1Value: React.ReactNode;
  let stat1Label: string;
  let stat1Helper: string;
  let stat2Value: React.ReactNode;
  let stat2Label: string;
  let stat2Helper: string;
  let ctaContent: React.ReactNode;

  switch (assessmentState) {
    case 'incomplete_data': {
      greeting = `Ola ${userName}! Complete seu diagnostico para descobrir seu potencial.`;
      subtitle = 'Responda algumas perguntas e receba seu relatorio de prontidao.';
      stat1Value = `${filledCount}/12`;
      stat1Label = 'Dados preenchidos';
      stat1Helper = 'Campos necessarios para o diagnostico';
      stat2Value = (
        <span className="flex items-center gap-1">
          <ClipboardCheck size={18} />
          Diagnostico
        </span>
      );
      stat2Label = 'Completar agora';
      stat2Helper = 'Receba sua analise personalizada';
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
      subtitle = 'Nossa IA esta analisando seus dados e gerando seu diagnostico personalizado. Tempo medio: ~90 segundos.';
      stat1Value = (
        <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
      );
      stat1Label = 'Processando';
      stat1Helper = 'IA analisando seus dados';
      stat2Value = 'Gerando...';
      stat2Label = 'Diagnostico';
      stat2Helper = 'Atualiza automaticamente quando pronto';
      ctaContent = (
        <span className={CTA_DISABLED_CLASS}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando seu diagnostico...
        </span>
      );
      break;
    }

    case 'needs_subscription': {
      greeting = getGreeting(config, userName, true);
      subtitle = 'Seu diagnostico esta pronto! Assine para ver todas as recomendacoes.';
      stat1Value = insights ? `${insights.score}/100` : '—';
      stat1Label = 'Prontidao';
      stat1Helper = 'Indice de preparo para o mercado internacional';
      stat2Value = insights?.phase
        ? insights.phase.name
        : temp
        ? temp.label
        : '—';
      stat2Label = insights?.phase ? 'Fase Atual' : temp ? 'Temperatura' : '—';
      stat2Helper = insights?.phase ? 'Estagio da sua jornada' : temp ? 'Nivel de urgencia do seu perfil' : '';
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
      stat1Helper = hasReport ? 'Indice de preparo para o mercado internacional' : 'Plano ativo na plataforma';
      stat2Value = hasReport && insights?.phase
        ? insights.phase.name
        : hasReport && temp
        ? temp.label
        : 'Diagnostico';
      stat2Label = hasReport && insights?.phase
        ? 'Fase Atual'
        : hasReport && temp
        ? 'Temperatura'
        : 'Comecar agora';
      stat2Helper = hasReport && insights?.phase
        ? 'Estagio da sua jornada'
        : hasReport && temp
        ? 'Nivel de urgencia do seu perfil'
        : 'Descubra seu potencial';

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
    <div className="bg-[#7367F0] rounded-xl p-4 sm:p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
      <div className="relative z-10">
        <h2 className="text-lg sm:text-xl font-bold mb-1">{greeting}</h2>
        <p className="text-indigo-100 text-sm mb-4 sm:mb-6">{subtitle}</p>

        <div className="flex gap-3 sm:gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 flex-1 min-w-0">
            <div className="text-xl sm:text-2xl font-bold mb-1 truncate">{stat1Value}</div>
            <div className="text-[11px] sm:text-xs font-medium text-indigo-100">{stat1Label}</div>
            <div className="text-[9px] sm:text-[10px] text-indigo-200/70 mt-0.5 leading-tight">{stat1Helper}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 flex-1 min-w-0">
            <div className="text-base sm:text-xl font-bold mb-1 leading-tight break-words">
              {stat2Value}
            </div>
            <div className="text-[11px] sm:text-xs font-medium text-indigo-100">{stat2Label}</div>
            <div className="text-[9px] sm:text-[10px] text-indigo-200/70 mt-0.5 leading-tight">{stat2Helper}</div>
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
