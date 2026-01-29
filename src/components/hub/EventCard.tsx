import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Lock, Radio, Users, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HubEvent } from '@/hooks/useHubEvents';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: HubEvent;
  onUpgradeClick?: () => void;
}

const planBadgeConfig = {
  basic: { label: 'BÁSICO', className: 'bg-muted text-muted-foreground' },
  pro: { label: 'PRO', className: 'bg-indigo-100 text-indigo-700' },
  vip: { label: 'VIP', className: 'bg-amber-100 text-amber-700' },
};

export function EventCard({ event, onUpgradeClick }: EventCardProps) {
  const { canAccess, isLive, requiredPlan } = event;
  const planConfig = planBadgeConfig[requiredPlan];

  const formattedDate = format(new Date(event.datetime), "dd MMM", { locale: ptBR });
  const formattedTime = format(new Date(event.datetime), "HH:mm");
  const formattedWeekday = format(new Date(event.datetime), "EEEE", { locale: ptBR });

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[24px] border bg-card transition-all duration-300',
        canAccess && 'hover:-translate-y-1 hover:shadow-xl hover:border-primary/30',
        !canAccess && 'cursor-default'
      )}
    >
      {/* Content */}
      <div className={cn('p-5', !canAccess && 'blur-[2px]')}>
        {/* Header Badges */}
        <div className="mb-3 flex items-center justify-between">
          {isLive ? (
            <Badge className="gap-1 bg-red-500 text-white animate-pulse">
              <Radio className="h-3 w-3" />
              AO VIVO
            </Badge>
          ) : (
            <Badge variant="outline" className={planConfig.className}>
              {planConfig.label}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{event.espaco_name}</span>
        </div>

        {/* Title */}
        <h3 className="mb-2 font-semibold text-foreground line-clamp-2">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Date & Time */}
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{formattedWeekday}, {formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* CTA */}
        {canAccess && event.meeting_link ? (
          <a href={event.meeting_link} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 rounded-xl" variant={isLive ? "default" : "outline"}>
              <Video className="h-4 w-4" />
              {isLive ? 'Entrar Agora' : 'Acessar Sessão'}
            </Button>
          </a>
        ) : canAccess ? (
          <Link to="/dashboard/agenda">
            <Button variant="outline" className="w-full rounded-xl">
              Ver no Calendário
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Locked Overlay */}
      {!canAccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
          <div className="p-6 text-center">
            <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
              <Lock className="h-6 w-6 text-amber-400" />
            </div>
            <p className="mb-2 text-sm font-medium text-white">
              Assista a mentoria de outros alunos ao vivo
            </p>
            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
              Disponível no Plano {planConfig.label}
            </Badge>
            <Button 
              onClick={onUpgradeClick}
              size="sm"
              className="mt-3 w-full rounded-lg bg-white text-slate-900 hover:bg-white/90"
            >
              Fazer Upgrade
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
