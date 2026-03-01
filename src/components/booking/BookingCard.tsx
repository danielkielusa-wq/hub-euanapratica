import { Clock, Video, MoreVertical, ArrowRight } from 'lucide-react';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BookingWithDetails, BookingPolicyLimits } from '@/types/booking';
import { BOOKING_STATUS_CONFIG } from '@/types/booking';

interface BookingCardProps {
  booking: BookingWithDetails;
  limits?: BookingPolicyLimits | null;
  onReschedule?: (booking: BookingWithDetails) => void;
  onCancel?: (booking: BookingWithDetails) => void;
  onJoinMeeting?: (booking: BookingWithDetails) => void;
}

export function BookingCard({
  booking,
  limits,
  onReschedule,
  onCancel,
  onJoinMeeting,
}: BookingCardProps) {
  const tz = useUserTimezone();
  const startDate = new Date(booking.scheduled_start);
  const isUpcoming = booking.status === 'confirmed' && startDate >= new Date();
  const canJoin = isUpcoming && booking.meeting_link;
  const config = BOOKING_STATUS_CONFIG[booking.status];

  const mentorInitial = booking.mentor?.full_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group cursor-pointer">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">

        {/* Date Box */}
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-1 min-w-[80px] text-center">
          <div className="text-3xl font-bold text-gray-800 dark:text-foreground">
            {formatInTz(startDate, tz, 'd')}
          </div>
          <div className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider">
            {formatInTz(startDate, tz, 'MMM')}
          </div>
          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded sm:mt-1">
            {formatInTz(startDate, tz, 'HH:mm')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h4 className="text-base font-bold text-gray-800 dark:text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {booking.service?.name || 'Serviço'}
            </h4>
            <span className={cn(
              'text-xs font-bold px-2.5 py-1 rounded-full w-fit flex-shrink-0',
              config.bgColor,
              config.color,
              `dark:bg-opacity-20`
            )}>
              {config.labelPt}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {booking.duration_minutes} min
            </span>
            {booking.meeting_link && (
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                Google Meet
              </span>
            )}
          </div>

          {booking.mentor && (
            <div className="flex items-center gap-2">
              {booking.mentor.profile_photo_url ? (
                <img
                  src={booking.mentor.profile_photo_url}
                  alt={booking.mentor.full_name}
                  className="w-6 h-6 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-muted-foreground">
                  {mentorInitial}
                </div>
              )}
              <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                Com {booking.mentor.full_name}
              </span>
            </div>
          )}

          {/* Actions for upcoming */}
          {isUpcoming && (
            <div className="flex items-center gap-3 mt-3">
              {canJoin && onJoinMeeting && (
                <Button
                  onClick={(e) => { e.stopPropagation(); onJoinMeeting(booking); }}
                  size="sm"
                  className="bg-[#7367F0] hover:bg-indigo-600 text-white text-xs rounded-lg h-8"
                >
                  Entrar na Reunião
                  <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              )}
              {!limits?.canReschedule && !limits?.canCancel && limits?.message && (
                <span className="text-xs text-gray-400 dark:text-muted-foreground italic">
                  {limits.message}
                </span>
              )}
            </div>
          )}

          {/* Past booking info */}
          {!isUpcoming && booking.status === 'completed' && booking.completed_at && (
            <p className="text-xs text-gray-400 dark:text-muted-foreground mt-2">
              Sessão concluída em {formatInTz(booking.completed_at, tz, "d 'de' MMMM")}
            </p>
          )}
          {!isUpcoming && booking.status === 'cancelled' && (
            <p className="text-xs text-gray-400 dark:text-muted-foreground mt-2">
              Cancelado{booking.cancelled_at && ` em ${formatInTz(booking.cancelled_at, tz, "d 'de' MMMM")}`}
              {booking.cancellation_reason && ` — ${booking.cancellation_reason}`}
            </p>
          )}
        </div>

        {/* Action menu (hover reveal) */}
        {isUpcoming && (limits?.canReschedule || limits?.canCancel) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {limits?.canReschedule && onReschedule && (
                <DropdownMenuItem onClick={() => onReschedule(booking)}>
                  Reagendar
                  {booking.reschedule_count > 0 && (
                    <span className="ml-2 text-gray-400 dark:text-muted-foreground">
                      ({limits.remainingReschedules} restantes)
                    </span>
                  )}
                </DropdownMenuItem>
              )}
              {limits?.canCancel && onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(booking)}
                  className="text-red-600"
                >
                  Cancelar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
