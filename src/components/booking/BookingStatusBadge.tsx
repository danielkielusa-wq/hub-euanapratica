import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import type { BookingStatus } from '@/types/booking';
import { BOOKING_STATUS_CONFIG } from '@/types/booking';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const STATUS_ICONS: Record<BookingStatus, typeof CheckCircle2> = {
  confirmed: Clock,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: AlertTriangle,
};

export function BookingStatusBadge({
  status,
  size = 'sm',
  showIcon = true,
}: BookingStatusBadgeProps) {
  const config = BOOKING_STATUS_CONFIG[status];
  const Icon = STATUS_ICONS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide border',
        config.bgColor,
        config.color,
        config.borderColor,
        size === 'sm' && 'px-2.5 py-0.5 text-[10px]',
        size === 'md' && 'px-3 py-1 text-xs'
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.labelPt}
    </span>
  );
}
