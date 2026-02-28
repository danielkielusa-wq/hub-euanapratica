import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import {
  Calendar,
  CalendarPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  BookOpen,
  Zap,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MyHubItem, PlanTool } from '@/hooks/useMyHub';

// ============================================
// Access source badge
// ============================================
function AccessBadge({ source }: { source: MyHubItem['access_source'] }) {
  if (source === 'plan') {
    return (
      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
        Incluso no plano
      </span>
    );
  }
  return (
    <span className="text-[10px] font-black uppercase tracking-widest bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
      Comprado
    </span>
  );
}

// ============================================
// Status icon
// ============================================
function StatusIcon({ status }: { status: MyHubItem['computed_status'] }) {
  switch (status) {
    case 'needs_action':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'scheduled':
      return <Calendar className="h-4 w-4 text-indigo-500" />;
    case 'active':
      return <PlayCircle className="h-4 w-4 text-emerald-500" />;
    case 'upcoming':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'not_started':
      return <BookOpen className="h-4 w-4 text-gray-400" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-gray-400" />;
  }
}

// ============================================
// Border color by status
// ============================================
const BORDER_BY_STATUS: Record<MyHubItem['computed_status'], string> = {
  needs_action: 'border-l-amber-400',
  scheduled: 'border-l-indigo-400',
  active: 'border-l-emerald-400',
  upcoming: 'border-l-blue-400',
  not_started: 'border-l-gray-200',
  completed: 'border-l-gray-200',
};

// ============================================
// Sub-info line by service_type + status
// ============================================
function SubInfo({ item, tz }: { item: MyHubItem; tz: string }) {
  const { service, computed_status, booking, next_session_datetime } = item;

  if (service.service_type === 'consulting') {
    if (computed_status === 'needs_action') {
      return <p className="text-sm text-amber-600 font-medium">Agende sua sessão para começar</p>;
    }
    if ((computed_status === 'scheduled' || computed_status === 'active') && booking) {
      const dt = parseISO(booking.scheduled_start);
      return (
        <p className="text-sm text-indigo-600 font-medium">
          Sessão: {formatInTz(dt, tz, "EEE dd/MM 'às' HH:mm")}
        </p>
      );
    }
    if (computed_status === 'completed') {
      return <p className="text-sm text-gray-400">Sessão concluída</p>;
    }
  }

  if (service.service_type === 'live_mentoring') {
    if (next_session_datetime) {
      const dt = parseISO(next_session_datetime);
      return (
        <p className="text-sm text-emerald-600 font-medium">
          Próxima sessão: {formatInTz(dt, tz, "EEE dd/MM 'às' HH:mm")}
        </p>
      );
    }
    return <p className="text-sm text-gray-400">Acesse seu Espaço para ver as próximas sessões</p>;
  }

  if (service.service_type === 'live_event') {
    const sessionDatetime = item.metadata?.session_datetime as string | undefined;
    if (sessionDatetime) {
      const dt = parseISO(sessionDatetime);
      return (
        <p className="text-sm text-blue-600 font-medium">
          {formatInTz(dt, tz, "EEE dd/MM 'às' HH:mm")}
        </p>
      );
    }
  }

  if (service.service_type === 'recorded_course') {
    const progress = (item.metadata?.progress_percent as number) ?? 0;
    if (progress > 0) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">{progress}%</span>
        </div>
      );
    }
    return <p className="text-sm text-gray-400">Ainda não iniciado</p>;
  }

  return null;
}

// ============================================
// CTA button per service_type + status
// ============================================
function JourneyCTA({ item }: { item: MyHubItem }) {
  const navigate = useNavigate();
  const { service, computed_status, booking } = item;

  if (computed_status === 'completed') {
    return (
      <Badge variant="secondary" className="text-xs text-gray-400">
        Concluído
      </Badge>
    );
  }

  // Dual CTA: consulting with a scheduled session AND remaining sessions to book
  if (
    service.service_type === 'consulting' &&
    computed_status === 'scheduled' &&
    item.remaining_bookable > 0
  ) {
    return (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/dashboard/agendar/${service.id}`)}
          className="gap-1.5 text-xs font-bold h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <CalendarPlus className="h-3 w-3" />
          Agendar Sessão
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (booking?.meeting_link) {
              window.open(booking.meeting_link, '_blank');
            } else {
              navigate('/dashboard/agendamentos');
            }
          }}
          className="gap-1.5 text-xs font-bold h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Entrar na Reunião
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const handleClick = () => {
    switch (service.service_type) {
      case 'consulting':
        if (computed_status === 'needs_action') {
          navigate(`/dashboard/agendar/${service.id}`);
        } else if (booking?.meeting_link) {
          window.open(booking.meeting_link, '_blank');
        } else {
          navigate(`/dashboard/agendar/${service.id}`);
        }
        break;
      case 'live_mentoring':
        if (service.espaco_id) {
          navigate(`/dashboard/espacos/${service.espaco_id}`);
        } else if (service.route) {
          navigate(service.route);
        }
        break;
      case 'live_event':
        if (item.metadata?.meeting_link) {
          window.open(item.metadata.meeting_link as string, '_blank');
        }
        break;
      case 'recorded_course':
        if (service.espaco_id) {
          navigate(`/dashboard/espacos/${service.espaco_id}`);
        } else if (service.route) {
          navigate(service.route);
        }
        break;
      case 'ai_tool':
        if (service.route) navigate(service.route);
        break;
      default:
        if (service.route) navigate(service.route);
    }
  };

  const label = (() => {
    switch (service.service_type) {
      case 'consulting':
        if (computed_status === 'needs_action') return 'Agendar Sessão';
        if (computed_status === 'scheduled') return 'Entrar na Reunião';
        return 'Ver Detalhes';
      case 'live_mentoring':
        return 'Acessar Espaço';
      case 'live_event':
        return 'Entrar no Evento';
      case 'recorded_course':
        return computed_status === 'not_started' ? 'Começar Curso' : 'Continuar';
      case 'ai_tool':
        return 'Usar Ferramenta';
      default:
        return service.cta_text || 'Acessar';
    }
  })();

  const isPrimary = computed_status === 'needs_action';

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className={cn(
        'gap-1.5 text-xs font-bold h-8',
        isPrimary
          ? 'bg-amber-500 hover:bg-amber-600 text-white'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
      )}
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </Button>
  );
}

// ============================================
// JourneyCard — main export
// ============================================
export function JourneyCard({ item }: { item: MyHubItem }) {
  const tz = useUserTimezone();
  const { service, computed_status, access_source } = item;

  const isCompleted = computed_status === 'completed';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm pl-5 pr-5 py-4 border-l-4 flex flex-col gap-3',
        'hover:shadow-md transition-shadow',
        BORDER_BY_STATUS[computed_status],
        isCompleted && 'opacity-60'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <StatusIcon status={computed_status} />
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{service.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{service.description?.slice(0, 60)}{(service.description?.length ?? 0) > 60 ? '…' : ''}</p>
          </div>
        </div>
        <AccessBadge source={access_source} />
      </div>

      {/* Sub-info */}
      <SubInfo item={item} tz={tz} />

      {/* Sessions counter (consulting with multiple sessions) */}
      {service.service_type === 'consulting' && (item.sessions_total ?? 0) > 1 && (() => {
        const scheduled = (item.sessions_total ?? 0) - item.sessions_used - item.remaining_bookable;
        const parts: string[] = [];
        if (scheduled > 0) parts.push(`${scheduled} agendada${scheduled > 1 ? 's' : ''}`);
        if (item.remaining_bookable > 0) parts.push(`${item.remaining_bookable} disponível${item.remaining_bookable > 1 ? 'eis' : ''}`);
        if (!parts.length) return null;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-gray-500">{parts[0]}</span>
            {parts[1] && <span className="text-amber-600 font-medium">&middot; {parts[1]}</span>}
          </div>
        );
      })()}

      {/* CTA */}
      <div className="flex justify-end">
        <JourneyCTA item={item} />
      </div>
    </div>
  );
}

// ============================================
// PlanToolCard — for plan-included AI tools
// ============================================
export function PlanToolCard({ tool }: { tool: PlanTool }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (tool.service.route) navigate(tool.service.route);
  };

  const progressPct = tool.is_unlimited
    ? 100
    : tool.credits_total > 0
    ? Math.min(100, Math.round(((tool.credits_total - tool.credits_remaining) / tool.credits_total) * 100))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow border-l-4 border-l-blue-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          <p className="font-bold text-gray-900 text-sm">{tool.service.name}</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
          Incluso no plano
        </span>
      </div>

      {/* Credit info */}
      {tool.is_unlimited ? (
        <p className="text-xs text-emerald-600 font-medium">Uso ilimitado este mês</p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{tool.credits_used} utilizados</span>
            <span>{tool.credits_remaining} restantes</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{tool.credits_total} créditos/mês</p>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleClick}
          className="gap-1.5 text-xs font-bold h-8 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {tool.service.cta_text || 'Usar Ferramenta'}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
