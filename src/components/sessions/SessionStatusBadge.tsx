import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Circle, Play, CheckCircle, XCircle } from 'lucide-react';

type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

interface SessionStatusBadgeProps {
  status: SessionStatus | null;
  className?: string;
}

const statusConfig: Record<SessionStatus, { label: string; icon: typeof Circle; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: {
    label: 'Agendada',
    icon: Circle,
    variant: 'secondary',
  },
  live: {
    label: 'Ao Vivo',
    icon: Play,
    variant: 'default',
  },
  completed: {
    label: 'Concluída',
    icon: CheckCircle,
    variant: 'outline',
  },
  cancelled: {
    label: 'Cancelada',
    icon: XCircle,
    variant: 'destructive',
  },
};

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = statusConfig[status || 'scheduled'];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        'gap-1.5',
        status === 'live' && 'bg-accent text-accent-foreground animate-pulse',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
