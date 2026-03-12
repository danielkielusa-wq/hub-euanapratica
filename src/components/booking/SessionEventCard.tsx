import { Clock, Video, Users } from 'lucide-react';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Session } from '@/types/dashboard';

const STATUS_CONFIG: Record<Session['status'], { labelPt: string; bgColor: string; color: string }> = {
  scheduled: { labelPt: 'Agendada', bgColor: 'bg-blue-100', color: 'text-blue-700' },
  in_progress: { labelPt: 'Ao Vivo', bgColor: 'bg-red-100', color: 'text-red-700' },
  completed: { labelPt: 'Concluída', bgColor: 'bg-gray-100', color: 'text-gray-500' },
  cancelled: { labelPt: 'Cancelada', bgColor: 'bg-gray-100', color: 'text-gray-400' },
};

interface SessionEventCardProps {
  session: Session;
}

export function SessionEventCard({ session }: SessionEventCardProps) {
  const tz = useUserTimezone();
  const isUpcoming = (session.status === 'scheduled' || session.status === 'in_progress') && session.date >= new Date();
  const canJoin = isUpcoming && session.meetingUrl;
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group cursor-pointer">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">

        {/* Date Box */}
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-1 min-w-[80px] text-center">
          <div className="text-3xl font-bold text-gray-800 dark:text-foreground">
            {formatInTz(session.date, tz, 'd')}
          </div>
          <div className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
            {formatInTz(session.date, tz, 'MMM')}
          </div>
          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded sm:mt-1">
            {formatInTz(session.date, tz, 'HH:mm')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-gray-800 dark:text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {session.title}
              </h4>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex-shrink-0 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Sessão
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
              <Users className="w-4 h-4" />
              {session.cohortName}
            </span>
            {session.meetingUrl && (
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
                  window.open(session.meetingUrl!, '_blank');
                }}
                size="sm"
                className="bg-[#7367F0] hover:bg-indigo-600 text-white text-xs rounded-lg h-8"
              >
                Participar da Sessão
                <Video className="ml-1.5 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
