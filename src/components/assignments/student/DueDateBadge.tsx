import { differenceInDays, differenceInHours, isPast, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DueDateBadgeProps {
  dueDate: string;
  submitted?: boolean;
  className?: string;
}

export function DueDateBadge({ dueDate, submitted, className }: DueDateBadgeProps) {
  const due = new Date(dueDate);
  const now = new Date();
  const daysLeft = differenceInDays(due, now);
  const hoursLeft = differenceInHours(due, now);
  const isLate = isPast(due);

  // If already submitted, show submitted badge
  if (submitted) {
    return (
      <Badge variant="pastelPurple" className={className}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Entregue
      </Badge>
    );
  }

  // Late
  if (isLate) {
    return (
      <Badge variant="pastelSlate" className={className}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        Atrasada
      </Badge>
    );
  }

  // Less than 3 days - Red/urgent
  if (daysLeft < 3) {
    const timeText = hoursLeft < 24 
      ? `${hoursLeft}h restantes` 
      : `${daysLeft} dias`;
    
    return (
      <Badge variant="pastelRose" className={className}>
        <Clock className="h-3 w-3 mr-1" />
        {timeText}
      </Badge>
    );
  }

  // 3-7 days - Warning
  if (daysLeft <= 7) {
    return (
      <Badge variant="pastelAmber" className={className}>
        <Clock className="h-3 w-3 mr-1" />
        {daysLeft} dias
      </Badge>
    );
  }

  // More than 7 days - Safe
  return (
    <Badge variant="pastelSlate" className={className}>
      <Clock className="h-3 w-3 mr-1" />
      {format(due, "dd/MM", { locale: ptBR })}
    </Badge>
  );
}
