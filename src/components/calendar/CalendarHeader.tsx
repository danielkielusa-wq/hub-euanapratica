import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void;
}

export function CalendarHeader({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {onToday && (
          <Button variant="ghost" size="sm" onClick={onToday}>
            Hoje
          </Button>
        )}
      </div>
      
      <h2 className="text-lg font-semibold capitalize">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </h2>
      
      <div className="w-[88px]" /> {/* Spacer for alignment */}
    </div>
  );
}
