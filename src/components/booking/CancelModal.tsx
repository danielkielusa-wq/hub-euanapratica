import { useState } from 'react';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, Loader2, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCancelBooking } from '@/hooks/useCancelBooking';
import { useBookingPolicy } from '@/hooks/useBookingPolicies';
import type { BookingWithDetails } from '@/types/booking';

interface CancelModalProps {
  booking: BookingWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelModal({ booking, open, onOpenChange }: CancelModalProps) {
  const [reason, setReason] = useState('');

  // Query
  const { data: policy } = useBookingPolicy(booking?.service_id);

  // Mutation
  const cancelBooking = useCancelBooking();

  if (!booking) return null;

  const sessionDate = new Date(booking.scheduled_start);
  const hoursUntilSession = differenceInHours(sessionDate, new Date());
  const isLateCancellation =
    hoursUntilSession < (policy?.cancellation_window_hours || 24);

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync({
        booking_id: booking.id,
        reason: reason || undefined,
      });
      onOpenChange(false);
      setReason('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancelar Agendamento
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Booking info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">
                <p className="font-bold text-gray-900">{booking.service?.name}</p>
                <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  {format(sessionDate, "EEEE, d 'de' MMMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              {/* Late cancellation warning */}
              {isLateCancellation && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-red-800 font-medium text-sm">
                    Atenção: Cancelamento tardio
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Este cancelamento está dentro do período de{' '}
                    {policy?.cancellation_window_hours || 24} horas antes da
                    sessão e será registrado como{' '}
                    <strong>não comparecimento</strong>.
                  </p>
                </div>
              )}

              {/* Normal cancellation info */}
              {!isLateCancellation && (
                <p className="text-gray-600 text-sm">
                  Tem certeza que deseja cancelar este agendamento? Esta ação não
                  pode ser desfeita.
                </p>
              )}

              {/* Reason field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Motivo do cancelamento (opcional)
                </label>
                <Textarea
                  placeholder="Informe o motivo do cancelamento..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelBooking.isPending}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelBooking.isPending}
          >
            {cancelBooking.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelamento'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
