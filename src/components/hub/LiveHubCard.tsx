import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ArrowRight, Radio, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MyLive } from '@/hooks/useMyLives';

export function LiveHubCard({ item }: { item: MyLive }) {
  const navigate = useNavigate();
  const { live } = item;
  const dt = parseISO(live.scheduled_at);
  const isLive = live.status === 'live';
  const isCompleted = live.status === 'completed';
  const isUpcoming = live.status === 'scheduled' && !isPast(dt);

  const handleClick = () => {
    if (isLive && live.meeting_link) {
      window.open(live.meeting_link, '_blank');
    } else {
      navigate(`/live/${live.slug}`);
    }
  };

  const label = isLive
    ? 'Entrar Agora'
    : isCompleted
    ? 'Ver Gravação'
    : 'Ver Detalhes';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm pl-5 pr-5 py-4 border-l-4 flex flex-col gap-3',
        'hover:shadow-md transition-shadow',
        isLive && 'border-l-red-400',
        isUpcoming && 'border-l-blue-400',
        isCompleted && 'border-l-gray-200 opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {isLive ? (
            <Radio className="h-4 w-4 text-red-500 animate-pulse flex-shrink-0 mt-0.5" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{live.title}</p>
            {live.description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{live.description.slice(0, 60)}{(live.description.length) > 60 ? '…' : ''}</p>
            )}
          </div>
        </div>

        {isLive && (
          <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
            Ao Vivo
          </span>
        )}
      </div>

      {/* Date/time */}
      <p className={cn(
        'text-sm font-medium',
        isLive ? 'text-red-600' : isUpcoming ? 'text-blue-600' : 'text-gray-400'
      )}>
        {isLive ? 'Acontecendo agora!' : format(dt, "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
      </p>

      {/* CTA */}
      <div className="flex justify-end">
        {isCompleted && !live.recording_url ? (
          <span className="text-xs text-gray-400 font-medium">Concluída</span>
        ) : (
          <Button
            size="sm"
            onClick={handleClick}
            className={cn(
              'gap-1.5 text-xs font-bold h-8',
              isLive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            )}
          >
            {label}
            {isLive ? <ExternalLink className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}
