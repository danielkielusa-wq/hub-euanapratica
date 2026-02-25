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
import type { CalendarEvent } from '@/types/calendar';

interface MonthCalendarProps {
  events: CalendarEvent[];
  perspective: 'mentor' | 'student';
  onJoinMeeting: (event: CalendarEvent) => void;
  onViewMaterials: (event: CalendarEvent) => void;
  onViewRecording: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function MonthCalendar({
  events,
  perspective,
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

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const dateKey = new Date(event.datetime).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });

    return map;
  }, [events]);

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

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDay.get(selectedDate.toDateString()) || [];
  }, [selectedDate, eventsByDay]);

  return (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6">
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
            className="text-center text-xs font-semibold text-gray-400 py-3 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const dayEvents = eventsByDay.get(date.toDateString()) || [];
          return (
            <DayCell
              key={date.toISOString()}
              date={date}
              currentMonth={currentMonth}
              sessions={dayEvents.map((e) => ({
                id: e.data.id,
                title: e.kind === 'session' ? e.data.title : (e.data.service?.name ?? 'Sessão 1:1'),
                datetime: e.datetime,
                status: e.kind === 'session' ? e.data.status : e.data.status,
                kind: e.kind,
              }))}
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
        events={selectedDateEvents}
        perspective={perspective}
        onJoinMeeting={onJoinMeeting}
        onViewMaterials={onViewMaterials}
        onViewRecording={onViewRecording}
      />
    </div>
  );
}
