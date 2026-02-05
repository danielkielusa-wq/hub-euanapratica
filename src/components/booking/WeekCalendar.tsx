import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeSlotPicker } from './TimeSlotPicker';
import type { TimeSlot, WeekSlots } from '@/types/booking';

interface WeekCalendarProps {
  weekSlots: WeekSlots | null;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onWeekChange: (offset: number) => void;
  weekOffset: number;
  isLoading?: boolean;
  maxAdvanceDays?: number;
}

export function WeekCalendar({
  weekSlots,
  selectedSlot,
  onSelectSlot,
  onWeekChange,
  weekOffset,
  isLoading,
  maxAdvanceDays = 30,
}: WeekCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate if we can navigate to previous/next week
  const today = startOfDay(new Date());
  const canGoPrevious = weekOffset > 0;
  const maxDate = addDays(today, maxAdvanceDays);
  const canGoNext = weekSlots ? isBefore(weekSlots.endDate, maxDate) : true;

  // Get slots for selected date
  const selectedDaySlots =
    selectedDate && weekSlots
      ? weekSlots.days.find((d) => isSameDay(d.date, selectedDate))?.slots || []
      : [];

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onWeekChange(weekOffset - 1)}
          disabled={!canGoPrevious || isLoading}
          className="rounded-full"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <h3 className="font-bold text-gray-900">
            {weekSlots
              ? `${format(weekSlots.startDate, "d 'de' MMMM", { locale: ptBR })} - ${format(weekSlots.endDate, "d 'de' MMMM", { locale: ptBR })}`
              : 'Carregando...'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Selecione um dia para ver os horários disponíveis
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onWeekChange(weekOffset + 1)}
          disabled={!canGoNext || isLoading}
          className="rounded-full"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Selector */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekSlots?.days.map((day) => {
            const isPast = isBefore(day.date, today);
            const hasSlots = day.slots.length > 0;
            const isSelected = selectedDate && isSameDay(day.date, selectedDate);
            const isDayToday = isToday(day.date);

            return (
              <button
                key={day.date.toISOString()}
                type="button"
                onClick={() => !isPast && hasSlots && setSelectedDate(day.date)}
                disabled={isPast || !hasSlots}
                className={cn(
                  'flex flex-col items-center p-3 rounded-xl transition-all',
                  'border-2',
                  isPast && 'opacity-40 cursor-not-allowed',
                  !isPast && !hasSlots && 'opacity-60 cursor-not-allowed',
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : hasSlots && !isPast
                      ? 'bg-white border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
                      : 'bg-gray-50 border-gray-100'
                )}
              >
                {/* Day name */}
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    isSelected ? 'text-indigo-200' : 'text-gray-400'
                  )}
                >
                  {format(day.date, 'EEE', { locale: ptBR })}
                </span>

                {/* Day number */}
                <span
                  className={cn(
                    'text-lg font-bold mt-1',
                    isSelected ? 'text-white' : 'text-gray-900',
                    isDayToday && !isSelected && 'text-indigo-600'
                  )}
                >
                  {format(day.date, 'd')}
                </span>

                {/* Slot indicator */}
                <div className="mt-1.5">
                  {hasSlots ? (
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-green-50 text-green-600'
                      )}
                    >
                      {day.slots.length} {day.slots.length === 1 ? 'horário' : 'horários'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      Indisponível
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Time Slots for Selected Day */}
      {selectedDate && (
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-4">
            Horários disponíveis para{' '}
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h4>
          <TimeSlotPicker
            slots={selectedDaySlots}
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
          />
        </div>
      )}

      {/* Timezone notice */}
      <p className="text-center text-xs text-gray-400">
        Horários exibidos no fuso horário de Brasília (BRT)
      </p>
    </div>
  );
}
