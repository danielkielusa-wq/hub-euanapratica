import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
import { ServiceHeader } from '@/components/booking/ServiceHeader';
import { WeekCalendar } from '@/components/booking/WeekCalendar';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { Button } from '@/components/ui/button';
import { useMentorForService, useWeeklySlots } from '@/hooks/useAvailableSlots';
import { useBookingPolicy, useCanCreateBooking } from '@/hooks/useBookingPolicies';
import { useCreateBooking } from '@/hooks/useCreateBooking';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { TimeSlot, BookingFlowState } from '@/types/booking';

type FlowStep = 'select-time' | 'confirm' | 'success';

export default function BookingFlow() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<FlowStep>('select-time');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Queries
  const { data: mentorService, isLoading: loadingMentor } =
    useMentorForService(serviceId);
  const { data: weekSlots, isLoading: loadingSlots, startDate, endDate } =
    useWeeklySlots(serviceId, weekOffset);
  const { data: policy } = useBookingPolicy(serviceId);
  const { canBook, remainingSlots, message: limitMessage } = useCanCreateBooking();

  // Mutations
  const createBooking = useCreateBooking();

  // Reset selected slot when week changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [weekOffset]);

  // Handle booking confirmation
  const handleConfirm = async () => {
    if (!selectedSlot || !serviceId) return;

    try {
      const id = await createBooking.mutateAsync({
        service_id: serviceId,
        scheduled_start: selectedSlot.slot_start,
        duration_minutes: selectedSlot.duration_minutes,
        student_notes: studentNotes || undefined,
      });

      setBookingId(id);
      setStep('success');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Render booking limit warning
  if (!canBook) {
    return (
      <DashboardLayout>
        <DashboardTopHeader />
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 rounded-2xl p-8 border border-red-100 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Limite de agendamentos atingido
              </h2>
              <p className="text-gray-600 mb-6">{limitMessage}</p>
              <Button onClick={() => navigate('/dashboard/agendamentos')}>
                Ver meus agendamentos
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render success state
  if (step === 'success') {
    return (
      <DashboardLayout>
        <DashboardTopHeader />
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Agendamento confirmado!
              </h2>
              <p className="text-gray-600 mb-6">
                Você receberá um email de confirmação com os detalhes da sessão
                e o link para a reunião.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/agendamentos')}
                >
                  Ver meus agendamentos
                </Button>
                <Button onClick={() => navigate('/dashboard/hub')}>
                  Voltar ao Hub
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardTopHeader />

      <div className="flex-1 p-6 bg-gray-50/50">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => {
              if (step === 'confirm') {
                setStep('select-time');
              } else {
                navigate(-1);
              }
            }}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Service & Mentor Header */}
          <ServiceHeader
            service={mentorService?.service}
            mentor={mentorService?.mentor}
            duration={mentorService?.slot_duration_minutes || 60}
            isLoading={loadingMentor}
          />

          {/* Remaining slots indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>
              Você pode agendar mais{' '}
              <strong className="text-indigo-600">{remainingSlots}</strong>{' '}
              {remainingSlots === 1 ? 'sessão' : 'sessões'}
            </span>
          </div>

          {/* Step content */}
          {step === 'select-time' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Selecione uma data e horário
              </h3>

              <WeekCalendar
                weekSlots={weekSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                onWeekChange={setWeekOffset}
                weekOffset={weekOffset}
                isLoading={loadingSlots}
                maxAdvanceDays={policy?.max_advance_days || 30}
              />

              {/* Continue button */}
              {selectedSlot && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Button
                    onClick={() => setStep('confirm')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    Continuar
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && selectedSlot && mentorService && (
            <BookingConfirmation
              service={mentorService.service}
              mentor={mentorService.mentor}
              selectedSlot={selectedSlot}
              policy={policy}
              studentNotes={studentNotes}
              onNotesChange={setStudentNotes}
              onConfirm={handleConfirm}
              onBack={() => setStep('select-time')}
              isConfirming={createBooking.isPending}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
