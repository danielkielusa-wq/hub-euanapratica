import { Clock, Video, Radio, Users } from 'lucide-react';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Live, LiveStatus } from '@/types/live';

const LIVE_STATUS_CONFIG: Record<LiveStatus, { labelPt: string; bgColor: string; color: string }> = {
  scheduled: { labelPt: 'Agendada', bgColor: 'bg-blue-100', color: 'text-blue-700' },
  live: { labelPt: 'Ao Vivo', bgColor: 'bg-red-100', color: 'text-red-700' },
  completed: { labelPt: 'Concluida', bgColor: 'bg-gray-100', color: 'text-gray-500' },
  cancelled: { labelPt: 'Cancelada', bgColor: 'bg-gray-100', color: 'text-gray-400' },
  draft: { labelPt: 'Rascunho', bgColor: 'bg-gray-100', color: 'text-gray-600' },
  expired: { labelPt: 'Expirada', bgColor: 'bg-orange-100', color: 'text-orange-700' },
};

interface LiveEventCardProps {
  live: Live;
}

export function LiveEventCard({ live }: LiveEventCardProps) {
  const tz = useUserTimezone();
  const startDate = new Date(live.scheduled_at);
  const isUpcoming = (live.status === 'scheduled' || live.status === 'live') && startDate >= new Date();
  const canJoin = isUpcoming && live.meeting_link;
  const config = LIVE_STATUS_CONFIG[live.status] || LIVE_STATUS_CONFIG.scheduled;

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group cursor-pointer">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">

        {/* Date Box */}
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-1 min-w-[80px] text-center">
          <div className="text-3xl font-bold text-gray-800 dark:text-foreground">
            {formatInTz(startDate, tz, 'd')}
          </div>
          <div className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
            {formatInTz(startDate, tz, 'MMM')}
          </div>
          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded sm:mt-1">
            {formatInTz(startDate, tz, 'HH:mm')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-gray-800 dark:text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {live.title}
              </h4>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 flex-shrink-0 flex items-center gap-1">
                <Radio className="w-3 h-3" />
                Live
              </span>
            </div>
            <span className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full w-fit flex-shrink-0',
              config.bgColor,
              config.color,
              'dark:bg-opacity-20'
            )}>
              {config.labelPt}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {live.duration_minutes} min
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Evento em grupo
            </span>
            {live.meeting_link && (
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                Online
              </span>
            )}
          </div>

          {isUpcoming && canJoin && (
            <div className="flex items-center gap-3 mt-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(live.meeting_link!, '_blank');
                }}
                size="sm"
                className="bg-[#7367F0] hover:bg-indigo-600 text-white text-xs rounded-lg h-8"
              >
                Entrar na Live
                <Radio className="ml-1.5 h-3 w-3" />
              </Button>
            </div>
          )}

          {live.status === 'completed' && live.recording_url && (
            <div className="flex items-center gap-3 mt-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(live.recording_url!, '_blank');
                }}
                size="sm"
                variant="outline"
                className="text-xs rounded-lg h-8"
              >
                Ver Gravacao
                <Video className="ml-1.5 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
