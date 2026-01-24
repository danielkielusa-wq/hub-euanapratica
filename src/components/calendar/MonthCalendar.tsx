import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { DayCell } from './DayCell';
import { SessionDayModal } from './SessionDayModal';
import type { Session } from '@/hooks/useSessions';

interface MonthCalendarProps {
  sessions: Session[];
  onJoinMeeting: (session: Session) => void;
  onViewMaterials: (session: Session) => void;
  onViewRecording: (session: Session) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function MonthCalendar({
  sessions,
  onJoinMeeting,
  onViewMaterials,
  onViewRecording,
}: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    
    sessions.forEach((session) => {
      const dateKey = new Date(session.datetime).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(session);
    });

    return map;
  }, [sessions]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessionsByDay.get(selectedDate.toDateString()) || [];
  }, [selectedDate, sessionsByDay]);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const daySessions = sessionsByDay.get(date.toDateString()) || [];
          return (
            <DayCell
              key={date.toISOString()}
              date={date}
              currentMonth={currentMonth}
              sessions={daySessions.map((s) => ({ id: s.id, status: s.status }))}
              isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
              onClick={() => handleDayClick(date)}
            />
          );
        })}
      </div>

      <SessionDayModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        date={selectedDate}
        sessions={selectedDateSessions}
        onJoinMeeting={onJoinMeeting}
        onViewMaterials={onViewMaterials}
        onViewRecording={onViewRecording}
      />
    </div>
  );
}
