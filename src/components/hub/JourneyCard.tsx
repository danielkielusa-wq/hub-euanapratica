import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import {
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  BookOpen,
  Zap,
  Clock,
  Users,
  FileText,
} from 'lucide-react';
import type { MyHubItem, PlanTool } from '@/hooks/useMyHub';

// ============================================
// Icon + color config per service type
// ============================================
const SERVICE_TYPE_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  consulting: { icon: Zap, bg: 'bg-indigo-100', color: 'text-indigo-600' },
  live_mentoring: { icon: Users, bg: 'bg-green-100', color: 'text-green-600' },
  recorded_course: { icon: BookOpen, bg: 'bg-purple-100', color: 'text-purple-600' },
  live_event: { icon: Calendar, bg: 'bg-orange-100', color: 'text-orange-600' },
  ai_tool: { icon: FileText, bg: 'bg-blue-100', color: 'text-blue-600' },
};

// ============================================
// Status label + color
// ============================================
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  needs_action: { label: 'Pendente', color: 'text-orange-500' },
  scheduled: { label: 'Confirmado', color: 'text-green-600' },
  active: { label: 'Em andamento', color: 'text-blue-600' },
  upcoming: { label: 'Em breve', color: 'text-blue-600' },
  not_started: { label: 'Não iniciado', color: 'text-gray-500' },
  completed: { label: 'Concluído', color: 'text-gray-400' },
};

// ============================================
// Subtitle line
// ============================================
function getSubtitle(item: MyHubItem, tz: string): string {
  const { service, computed_status, booking, next_session_datetime } = item;

  if (service.service_type === 'consulting') {
    if (computed_status === 'needs_action') return 'Agende sua sessão';
    if ((computed_status === 'scheduled' || computed_status === 'active') && booking) {
      const dt = parseISO(booking.scheduled_start);
      return formatInTz(dt, tz, "EEE dd/MM 'às' HH:mm");
    }
    if (computed_status === 'completed') return 'Sessão concluída';
  }

  if (service.service_type === 'live_mentoring' && next_session_datetime) {
    const dt = parseISO(next_session_datetime);
    return `Próxima: ${formatInTz(dt, tz, "EEE dd/MM 'às' HH:mm")}`;
  }

  if (service.service_type === 'live_event') {
    const sessionDatetime = item.metadata?.session_datetime as string | undefined;
    if (sessionDatetime) {
      const dt = parseISO(sessionDatetime);
      return formatInTz(dt, tz, "EEE dd/MM 'às' HH:mm");
    }
  }

  return service.description?.slice(0, 50) || '';
}

// ============================================
// Navigation handler
// ============================================
function getClickHandler(item: MyHubItem, navigate: ReturnType<typeof useNavigate>) {
  const { service, computed_status, booking } = item;

  return () => {
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
        if (service.espaco_id) navigate(`/dashboard/espacos/${service.espaco_id}`);
        else if (service.route) navigate(service.route);
        break;
      case 'live_event':
        if (item.metadata?.meeting_link) {
          window.open(item.metadata.meeting_link as string, '_blank');
        }
        break;
      case 'recorded_course':
        if (service.espaco_id) navigate(`/dashboard/espacos/${service.espaco_id}`);
        else if (service.route) navigate(service.route);
        break;
      case 'ai_tool':
        if (service.route) navigate(service.route);
        break;
      default:
        if (service.route) navigate(service.route);
    }
  };
}

// ============================================
// JourneyCard — ActivityItem pattern
// ============================================
export function JourneyCard({ item }: { item: MyHubItem }) {
  const navigate = useNavigate();
  const tz = useUserTimezone();
  const { service, computed_status } = item;

  const typeConfig = SERVICE_TYPE_ICONS[service.service_type] ?? SERVICE_TYPE_ICONS.consulting;
  const Icon = typeConfig.icon;
  const statusCfg = STATUS_CONFIG[computed_status] ?? STATUS_CONFIG.active;
  const subtitle = getSubtitle(item, tz);
  const handleClick = getClickHandler(item, navigate);

  return (
    <button onClick={handleClick} className="w-full flex items-center justify-between text-left group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} ${typeConfig.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-foreground">{service.name}</div>
          <div className="text-xs text-gray-500 dark:text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className={`text-xs font-bold ${statusCfg.color} whitespace-nowrap ${computed_status === 'needs_action' ? 'animate-pulse' : ''}`}>
        {statusCfg.label}
      </div>
    </button>
  );
}

// ============================================
// PlanToolCard — ActivityItem for plan tools
// ============================================
export function PlanToolCard({ tool }: { tool: PlanTool }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (tool.service.route) navigate(tool.service.route);
  };

  const subtitle = tool.is_unlimited
    ? 'Uso ilimitado'
    : `${tool.credits_remaining} / ${tool.credits_total} créditos`;

  return (
    <button onClick={handleClick} className="w-full flex items-center justify-between text-left group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-foreground">{tool.service.name}</div>
          <div className="text-xs text-gray-500 dark:text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className="text-xs font-bold text-blue-600">
        {tool.service.cta_text || 'Usar'}
      </div>
    </button>
  );
}
