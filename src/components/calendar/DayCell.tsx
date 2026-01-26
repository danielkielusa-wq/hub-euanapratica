import { cn } from '@/lib/utils';
import { isSameMonth, isToday } from 'date-fns';
import { format } from 'date-fns';

interface SessionData {
  id: string;
  title: string;
  datetime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | null;
}

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  sessions: SessionData[];
  isSelected?: boolean;
  onClick?: () => void;
}

export function DayCell({
  date,
  currentMonth,
  sessions,
  isSelected,
  onClick,
}: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isToday(date);
  const hasSessions = sessions.length > 0;
  
  // Get visible sessions (max 2)
  const visibleSessions = sessions.slice(0, 2);
  const remainingCount = sessions.length - 2;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start p-2 min-h-[100px] lg:min-h-[120px] text-sm transition-colors rounded-lg border border-transparent',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        !isCurrentMonth && 'bg-gray-50/50',
        isSelected && 'ring-2 ring-indigo-500'
      )}
    >
      {/* Day Number */}
      <span
        className={cn(
          'flex items-center justify-center w-7 h-7 text-sm font-medium',
          !isCurrentMonth && 'text-gray-400',
          isCurrentMonth && !isCurrentDay && 'text-gray-700',
          isCurrentDay && 'bg-indigo-500 text-white rounded-full'
        )}
      >
        {date.getDate()}
      </span>
      
      {/* Session Pills */}
      {hasSessions && isCurrentMonth && (
        <div className="flex flex-col gap-1 mt-1 w-full">
          {visibleSessions.map((session) => {
            const time = format(new Date(session.datetime), 'HH:mm');
            return (
              <div
                key={session.id}
                className={cn(
                  'w-full px-2 py-1 rounded-md text-xs font-medium truncate',
                  'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                )}
                title={`${time} • ${session.title}`}
              >
                {time} • {session.title}
              </div>
            );
          })}
          {remainingCount > 0 && (
            <span className="text-xs text-gray-500 font-medium pl-1">
              +{remainingCount} mais
            </span>
          )}
        </div>
      )}
    </button>
  );
}
