import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Users, Radio } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LiveWithMentor } from '@/types/live';
import { ACCESS_TYPE_LABELS, ACCESS_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS } from '@/types/live';

interface LiveCardProps {
  live: LiveWithMentor;
  showStatus?: boolean;
  onClick?: () => void;
}

export function LiveCard({ live, showStatus, onClick }: LiveCardProps) {
  const navigate = useNavigate();
  const dt = parseISO(live.scheduled_at);
  const isLive = live.status === 'live';
  const isPast = live.status === 'completed' || live.status === 'cancelled';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/live/${live.slug}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer',
        'hover:shadow-md transition-all hover:-translate-y-0.5',
        isLive && 'ring-2 ring-red-400 ring-offset-2',
        isPast && 'opacity-60'
      )}
    >
      {/* Thumbnail */}
      {live.thumbnail_url ? (
        <div className="aspect-video bg-gray-100 relative">
          <img
            src={live.thumbnail_url}
            alt={live.title}
            className="w-full h-full object-cover"
          />
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              <Radio className="h-3 w-3" />
              AO VIVO
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center relative">
          <Radio className="h-10 w-10 text-indigo-300" />
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              <Radio className="h-3 w-3" />
              AO VIVO
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
            ACCESS_TYPE_COLORS[live.access_type]
          )}>
            {ACCESS_TYPE_LABELS[live.access_type]}
          </span>
          {showStatus && (
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
              STATUS_COLORS[live.status]
            )}>
              {STATUS_LABELS[live.status]}
            </span>
          )}
          {live.access_type === 'paid' && live.price > 0 && (
            <span className="text-xs font-bold text-amber-700">
              R$ {live.price.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
          {live.title}
        </h3>

        {/* Description */}
        {live.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{live.description}</p>
        )}

        {/* Date + Duration */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(dt, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{live.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{live.registration_count}</span>
          </div>
        </div>

        {/* Mentor */}
        {live.mentor && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
            <Avatar className="h-6 w-6">
              <AvatarImage src={live.mentor.profile_photo_url || undefined} />
              <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600">
                {live.mentor.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 font-medium">{live.mentor.full_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
