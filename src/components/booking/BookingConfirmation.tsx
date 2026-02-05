import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TimeSlot, BookingPolicy } from '@/types/booking';

interface BookingConfirmationProps {
  service: {
    name: string;
    description: string | null;
  };
  mentor: {
    full_name: string;
    profile_photo_url: string | null;
  };
  selectedSlot: TimeSlot;
  policy?: BookingPolicy;
  studentNotes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isConfirming?: boolean;
}

export function BookingConfirmation({
  service,
  mentor,
  selectedSlot,
  policy,
  studentNotes,
  onNotesChange,
  onConfirm,
  onBack,
  isConfirming,
}: BookingConfirmationProps) {
  const startTime = new Date(selectedSlot.slot_start);
  const endTime = new Date(selectedSlot.slot_end);

  return (
    <div className="space-y-6">
      {/* Booking Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium text-indigo-200">
              Confirme seu agendamento
            </span>
          </div>
          <h3 className="text-xl font-bold">{service.name}</h3>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
              <p className="text-gray-500 text-sm">
                {format(startTime, 'HH:mm', { locale: ptBR })} -{' '}
                {format(endTime, 'HH:mm', { locale: ptBR })} (
                {selectedSlot.duration_minutes} minutos)
              </p>
            </div>
          </div>

          {/* Mentor */}
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={mentor.profile_photo_url || undefined} />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {mentor.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{mentor.full_name}</p>
              <p className="text-gray-500 text-sm">Mentor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observações (opcional)
        </label>
        <Textarea
          placeholder="Adicione qualquer informação relevante para a sessão..."
          value={studentNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={isConfirming}
        />
      </div>

      {/* Policy Notice */}
      {policy && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Política de cancelamento</p>
              <ul className="space-y-1 text-amber-700">
                <li>
                  • Cancelamento gratuito até{' '}
                  <strong>{policy.cancellation_window_hours} horas</strong> antes
                  da sessão
                </li>
                <li>
                  • Você pode reagendar até{' '}
                  <strong>{policy.max_reschedules_per_booking} vezes</strong>
                </li>
                <li>
                  • Cancelamentos tardios podem ser marcados como não comparecimento
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isConfirming}
          className="flex-1"
        >
          Voltar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex-[2] bg-indigo-600 hover:bg-indigo-700"
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            'Confirmar Agendamento'
          )}
        </Button>
      </div>
    </div>
  );
}
