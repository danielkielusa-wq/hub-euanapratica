import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Video, PlayCircle } from 'lucide-react';
import type { MyLive } from '@/hooks/useMyLives';

export function LiveHubCard({ item }: { item: MyLive }) {
  const navigate = useNavigate();
  const { live } = item;
  const dt = parseISO(live.scheduled_at);
  const isLive = live.status === 'live';
  const isCompleted = live.status === 'completed';

  const handleClick = () => {
    if (isLive && live.meeting_link) {
      window.open(live.meeting_link, '_blank');
    } else {
      navigate(`/live/${live.slug}`);
    }
  };

  // Icon + color per status
  const iconConfig = isLive
    ? { icon: Video, bg: 'bg-red-100', color: 'text-red-600' }
    : isCompleted
    ? { icon: PlayCircle, bg: 'bg-purple-100', color: 'text-purple-600' }
    : { icon: Calendar, bg: 'bg-orange-100', color: 'text-orange-600' };

  const Icon = iconConfig.icon;

  // Status label + color
  const statusLabel = isLive
    ? 'Ao Vivo'
    : isCompleted
    ? (live.recording_url ? 'Assistir' : 'Concluída')
    : 'Agendado';

  const statusColor = isLive
    ? 'text-red-600 animate-pulse'
    : isCompleted
    ? (live.recording_url ? 'text-purple-600' : 'text-gray-500')
    : 'text-gray-500';

  // Subtitle
  const subtitle = isLive
    ? 'Acontecendo agora!'
    : format(dt, "EEE dd/MM 'às' HH:mm", { locale: ptBR });

  return (
    <button onClick={handleClick} className="w-full flex items-center justify-between text-left group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${iconConfig.bg} ${iconConfig.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-foreground">{live.title}</div>
          <div className="text-xs text-gray-500 dark:text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className={`text-xs font-bold ${statusColor} whitespace-nowrap`}>
        {statusLabel}
      </div>
    </button>
  );
}
