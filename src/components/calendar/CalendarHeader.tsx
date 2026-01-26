import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
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
  // Format: "Janeiro De 2026" (capitalize De)
  const monthYear = format(currentMonth, 'MMMM yyyy', { locale: ptBR });
  const formattedMonth = monthYear.replace(/^(\w)/, c => c.toUpperCase()).replace(' ', ' De ');

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onPreviousMonth}
          className="rounded-lg border-gray-200 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onNextMonth}
          className="rounded-lg border-gray-200 hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {onToday && (
          <Button 
            onClick={onToday}
            className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-full px-4 py-1.5 text-sm font-medium h-auto border-0"
          >
            Hoje
          </Button>
        )}
      </div>
      
      <h2 className="text-lg font-semibold text-gray-900">
        {formattedMonth}
      </h2>
      
      <div className="w-[140px]" /> {/* Spacer for alignment */}
    </div>
  );
}
