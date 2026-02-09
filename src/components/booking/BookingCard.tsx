import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Video, ArrowRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookingStatusBadge } from './BookingStatusBadge';
import type { BookingWithDetails, BookingPolicyLimits } from '@/types/booking';

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
  const startDate = new Date(booking.scheduled_start);
  const isUpcoming = booking.status === 'confirmed' && startDate >= new Date();
  const canJoin = isUpcoming && booking.meeting_link;

  return (
    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Date Box */}
        <div className="flex-shrink-0 flex md:flex-col items-center gap-2 md:gap-0 bg-gray-50 rounded-2xl p-4 min-w-[100px] justify-center border border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {format(startDate, 'MMM', { locale: ptBR })}
          </span>
          <span className="text-2xl font-black text-gray-900">
            {format(startDate, 'd')}
          </span>
          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-md mt-1">
            {format(startDate, 'HH:mm', { locale: ptBR })}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              {booking.service?.name || 'Serviço'}
            </h3>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {booking.duration_minutes} min
            </span>
            {booking.meeting_link && (
              <span className="flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                Google Meet
              </span>
            )}
            {booking.mentor && (
              <span className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={booking.mentor.profile_photo_url || undefined}
                  />
                  <AvatarFallback className="text-[10px]">
                    {booking.mentor.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-700">
                  {booking.mentor.full_name}
                </span>
              </span>
            )}
          </div>

          {/* Actions */}
          {isUpcoming && (
            <div className="flex gap-3 mt-auto">
              {canJoin && onJoinMeeting && (
                <Button
                  onClick={() => onJoinMeeting(booking)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                  size="sm"
                >
                  Entrar na Reunião
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              )}

              {(limits?.canReschedule || limits?.canCancel) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {limits?.canReschedule && onReschedule && (
                      <DropdownMenuItem onClick={() => onReschedule(booking)}>
                        Reagendar
                        {booking.reschedule_count > 0 && (
                          <span className="ml-2 text-gray-400">
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

              {!limits?.canReschedule && !limits?.canCancel && limits?.message && (
                <span className="text-xs text-gray-400 italic">
                  {limits.message}
                </span>
              )}
            </div>
          )}

          {/* Past booking info */}
          {!isUpcoming && booking.status === 'completed' && (
            <p className="text-sm text-gray-500">
              Sessão concluída em{' '}
              {format(new Date(booking.completed_at!), "d 'de' MMMM", {
                locale: ptBR,
              })}
            </p>
          )}

          {!isUpcoming && booking.status === 'cancelled' && (
            <p className="text-sm text-gray-500">
              Cancelado{' '}
              {booking.cancelled_at &&
                `em ${format(new Date(booking.cancelled_at), "d 'de' MMMM", {
                  locale: ptBR,
                })}`}
              {booking.cancellation_reason && ` - ${booking.cancellation_reason}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
