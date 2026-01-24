import { cn } from '@/lib/utils';
import { isSameDay, isToday, isSameMonth } from 'date-fns';

interface SessionIndicator {
  id: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | null;
}

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  sessions: SessionIndicator[];
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
  const hasLiveSession = sessions.some((s) => s.status === 'live');
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-start p-2 h-20 lg:h-24 text-sm transition-colors rounded-lg',
        'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        !isCurrentMonth && 'text-muted-foreground/40',
        isCurrentDay && 'bg-primary/10',
        isSelected && 'ring-2 ring-primary',
        hasSessions && isCurrentMonth && 'font-medium'
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-full',
          isCurrentDay && 'bg-primary text-primary-foreground'
        )}
      >
        {date.getDate()}
      </span>
      
      {/* Session Indicators */}
      {hasSessions && isCurrentMonth && (
        <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
          {sessions.slice(0, 3).map((session, i) => (
            <span
              key={session.id || i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                session.status === 'live' && 'bg-accent animate-pulse',
                session.status === 'scheduled' && 'bg-primary',
                session.status === 'completed' && 'bg-muted-foreground',
                session.status === 'cancelled' && 'bg-destructive'
              )}
            />
          ))}
          {sessions.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{sessions.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}
