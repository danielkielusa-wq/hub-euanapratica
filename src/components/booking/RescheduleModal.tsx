import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WeekCalendar } from './WeekCalendar';
import { useWeeklySlots } from '@/hooks/useAvailableSlots';
import { useRescheduleBooking } from '@/hooks/useRescheduleBooking';
import { useBookingPolicy } from '@/hooks/useBookingPolicies';
import type { BookingWithDetails, TimeSlot } from '@/types/booking';

interface RescheduleModalProps {
  booking: BookingWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleModal({
  booking,
  open,
  onOpenChange,
}: RescheduleModalProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Queries
  const { data: weekSlots, isLoading: loadingSlots } = useWeeklySlots(
    booking?.service_id,
    weekOffset
  );
  const { data: policy } = useBookingPolicy(booking?.service_id);

  // Mutation
  const rescheduleBooking = useRescheduleBooking();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setWeekOffset(0);
      setSelectedSlot(null);
    }
  }, [open]);

  const handleReschedule = async () => {
    if (!booking || !selectedSlot) return;

    try {
      await rescheduleBooking.mutateAsync({
        booking_id: booking.id,
        new_start: selectedSlot.slot_start,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (!booking) return null;

  const currentDate = new Date(booking.scheduled_start);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Reagendar Sessão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current booking info */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Agendamento Atual
            </p>
            <p className="font-bold text-gray-900">{booking.service?.name}</p>
            <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {format(currentDate, "EEEE, d 'de' MMMM 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>

          {/* Reschedule warning */}
          {booking.reschedule_count > 0 && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium">
                  Você já reagendou esta sessão {booking.reschedule_count}{' '}
                  {booking.reschedule_count === 1 ? 'vez' : 'vezes'}.
                </p>
                <p className="text-amber-700">
                  Restam{' '}
                  {(policy?.max_reschedules_per_booking || 2) -
                    booking.reschedule_count}{' '}
                  reagendamentos.
                </p>
              </div>
            </div>
          )}

          {/* Calendar */}
          <div>
            <p className="font-medium text-gray-900 mb-4">
              Selecione um novo horário
            </p>
            <WeekCalendar
              weekSlots={weekSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              onWeekChange={setWeekOffset}
              weekOffset={weekOffset}
              isLoading={loadingSlots}
              maxAdvanceDays={policy?.max_advance_days || 30}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rescheduleBooking.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedSlot || rescheduleBooking.isPending}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700"
            >
              {rescheduleBooking.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reagendando...
                </>
              ) : (
                'Confirmar Novo Horário'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
