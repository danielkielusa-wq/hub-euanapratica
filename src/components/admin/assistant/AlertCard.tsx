import { AlertTriangle, Info, AlertCircle, Check, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AssistantAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: Record<string, unknown>;
  acknowledged: boolean;
  created_at: string;
}

interface AlertCardProps {
  alert: AssistantAlert;
  onAcknowledge: (alertId: string) => void;
  onAskAurora: (question: string) => void;
}

const SEVERITY_STYLES = {
  info: {
    border: 'border-blue-300 dark:border-blue-700',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  warning: {
    border: 'border-amber-300 dark:border-amber-700',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  critical: {
    border: 'border-red-300 dark:border-red-700',
    bg: 'bg-red-50/50 dark:bg-red-950/20',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
};

const SEVERITY_ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const SEVERITY_LABELS = {
  info: 'Info',
  warning: 'Aviso',
  critical: 'Crítico',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function AlertCard({ alert, onAcknowledge, onAskAurora }: AlertCardProps) {
  const styles = SEVERITY_STYLES[alert.severity];
  const Icon = SEVERITY_ICONS[alert.severity];

  return (
    <div className={cn('rounded-lg border p-3 text-sm', styles.border, styles.bg)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', styles.badge)}>
              {SEVERITY_LABELS[alert.severity]}
            </span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(alert.created_at)}</span>
          </div>
          <p className="font-medium text-sm">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>

          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
              className="h-6 px-2 text-[10px]"
            >
              <Check className="h-3 w-3 mr-1" />
              Reconhecer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAskAurora(`Me explique o alerta "${alert.title}". O que está acontecendo e o que devo fazer?`)}
              className="h-6 px-2 text-[10px]"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Perguntar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
