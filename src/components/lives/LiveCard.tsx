import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Users, Play, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveWithMentor } from '@/types/live';
import { ACCESS_TYPE_LABELS, ACCESS_TYPE_COLORS } from '@/types/live';

interface LiveCardProps {
  live: LiveWithMentor;
  showStatus?: boolean;
  onClick?: () => void;
}

export function LiveCard({ live, showStatus, onClick }: LiveCardProps) {
  const navigate = useNavigate();
  const dt = parseISO(live.scheduled_at);
  const isLive = live.status === 'live';
  const isUpcoming = live.status === 'scheduled';
  const isCompleted = live.status === 'completed';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/live/${live.slug}`);
    }
  };

  // Date label
  const dateLabel = isCompleted
    ? `Gravado • ${live.duration_minutes}m`
    : format(dt, "dd MMM, HH:mm", { locale: ptBR });

  // Mentor initials
  const mentorInitial = live.mentor?.full_name?.charAt(0) || '?';

  return (
    <div
      onClick={handleClick}
      className={cn(
        'bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden group hover:shadow-md transition-all cursor-pointer',
        isLive && 'ring-2 ring-red-400 ring-offset-2 dark:ring-offset-background'
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        {live.thumbnail_url ? (
          <img
            src={live.thumbnail_url}
            alt={live.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-800 flex items-center justify-center p-4">
            <span className="text-white/10 text-2xl font-bold text-center leading-tight select-none line-clamp-3">
              {live.title}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

        {/* Top-left badge */}
        <div className="absolute top-3 left-3">
          {isLive ? (
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              AO VIVO
            </span>
          ) : (
            <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
              {isUpcoming ? <Calendar className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {dateLabel}
            </span>
          )}
        </div>

        {/* Bottom-right views for recorded */}
        {isCompleted && live.registration_count > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="text-white text-xs font-medium drop-shadow-md">
              {live.registration_count} inscritos
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className={cn(
            'text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide',
            ACCESS_TYPE_COLORS[live.access_type]
          )}>
            {ACCESS_TYPE_LABELS[live.access_type]}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-800 dark:text-foreground text-lg mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {live.title}
        </h3>

        {/* Meta row */}
        {!isCompleted && (
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {live.duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {live.registration_count}
            </span>
          </div>
        )}

        {/* Footer: Speaker + Action */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
          {live.mentor ? (
            <div className="flex items-center gap-2">
              {live.mentor.profile_photo_url ? (
                <img
                  src={live.mentor.profile_photo_url}
                  alt={live.mentor.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-muted-foreground">
                  {mentorInitial}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-gray-800 dark:text-foreground">{live.mentor.full_name}</div>
                <div className="text-[10px] text-gray-500 dark:text-muted-foreground">Mentor</div>
              </div>
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'p-2 rounded-full transition-colors',
              isUpcoming || isLive
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                : 'text-gray-400 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-white/5'
            )}
          >
            {isUpcoming || isLive ? <Bell className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
